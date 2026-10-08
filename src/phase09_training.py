"""
Phase 9: Optimized Training Strategy
======================================
Complete training pipeline with:
- AdamW optimizer with differential learning rates
- CrossEntropyLoss
- OneCycleLR scheduler (built-in warmup, faster convergence)
- Mixed precision training (FP16)
- Gradient clipping (max_norm=1.0)
- Two-stage training (head-only → fine-tune)
- Early stopping with best model saving
- Per-epoch checkpointing for crash recovery
- Memory cleanup for Colab stability

Usage:
    python scripts/run_training.py [--epochs 40] [--subset 0.1]

    Or programmatically:
        from src.phase09_training import Trainer
        trainer = Trainer(model, train_loader, val_loader)
        history = trainer.train()
"""

import gc
import json
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import f1_score
from torch.cuda.amp import GradScaler, autocast
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.phase10_regularization import EarlyStopping, TrainingDiagnostics
from src.utils import format_duration, count_parameters, setup_logging, print_separator


class Trainer:
    """
    Optimized training orchestrator for the BirdCLEF model.

    Key optimizations over baseline:
    - OneCycleLR scheduler with warmup for 2-3× faster convergence
    - Gradient clipping to prevent explosion with higher LR
    - set_to_none=True for zero_grad (saves memory)
    - Memory cleanup between training stages
    - Per-epoch checkpointing for crash recovery

    Implements a two-stage training strategy:
    1. Train only the classifier head (backbone frozen)
    2. Gradually unfreeze backbone layers and fine-tune

    Args:
        model: BirdCLEFModel instance.
        train_loader: Training DataLoader.
        val_loader: Validation DataLoader.
        device: Training device.
        logger: Logger instance.
    """

    def __init__(self, model, train_loader, val_loader, device=None, logger=None):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device or config.DEVICE
        self.logger = logger or setup_logging()

        # Loss function
        self.criterion = nn.CrossEntropyLoss()

        # Mixed precision
        self.use_amp = config.USE_MIXED_PRECISION and self.device.type == "cuda"
        self.scaler = GradScaler() if self.use_amp else None

        # Early stopping
        self.early_stopping = EarlyStopping(mode="max")  # Monitor val F1

        # Diagnostics
        self.diagnostics = TrainingDiagnostics()

        # Training history
        self.history = {
            "train_loss": [], "val_loss": [],
            "train_acc": [], "val_acc": [],
            "train_f1": [], "val_f1": [],
            "lr": [],
        }

    def _setup_optimizer(self, stage="head", num_epochs=None):
        """
        Configure optimizer and OneCycleLR scheduler for the current stage.

        Args:
            stage: 'head' for classifier-only training, 'finetune' for full model.
            num_epochs: Number of epochs for this stage (needed for OneCycleLR).
        """
        if stage == "head":
            self.optimizer = torch.optim.AdamW(
                self.model.classifier.parameters(),
                lr=config.LEARNING_RATE_HEAD,
                weight_decay=config.WEIGHT_DECAY,
            )
            max_lr = config.LEARNING_RATE_HEAD
        else:
            param_groups = self.model.get_parameter_groups()
            self.optimizer = torch.optim.AdamW(
                param_groups,
                weight_decay=config.WEIGHT_DECAY,
            )
            max_lr = [config.LEARNING_RATE_FINETUNE, config.LEARNING_RATE_HEAD]

        # OneCycleLR: built-in warmup → peak → annealing. Converges 2-3× faster.
        steps_per_epoch = len(self.train_loader)
        total_steps = steps_per_epoch * (num_epochs or 10)

        self.scheduler = torch.optim.lr_scheduler.OneCycleLR(
            self.optimizer,
            max_lr=max_lr,
            total_steps=total_steps,
            pct_start=0.1,       # 10% warmup
            anneal_strategy="cos",
            div_factor=10,       # initial_lr = max_lr / 10
            final_div_factor=100, # final_lr = initial_lr / 100
        )

    def train_epoch(self):
        """
        Train for one epoch with gradient clipping and OneCycleLR stepping.

        Returns:
            tuple: (avg_loss, accuracy, f1)
        """
        self.model.train()
        running_loss = 0.0
        all_preds = []
        all_labels = []

        pbar = tqdm(self.train_loader, desc="Training", leave=False)
        for batch_idx, (inputs, labels) in enumerate(pbar):
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            # set_to_none=True saves memory by releasing gradient tensors
            self.optimizer.zero_grad(set_to_none=True)

            if self.use_amp:
                with autocast():
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, labels)
                self.scaler.scale(loss).backward()
                # Gradient clipping prevents explosion with higher OneCycleLR peaks
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                self.optimizer.step()

            # Step OneCycleLR per-batch (required by OneCycleLR)
            self.scheduler.step()

            running_loss += loss.item() * inputs.size(0)
            preds = outputs.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

            pbar.set_postfix({"loss": f"{loss.item():.4f}"})

        avg_loss = running_loss / len(self.train_loader.dataset)
        accuracy = np.mean(np.array(all_preds) == np.array(all_labels))
        f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

        return avg_loss, accuracy, f1

    @torch.no_grad()
    def validate(self):
        """
        Validate the model on the validation set.

        Returns:
            tuple: (avg_loss, accuracy, f1)
        """
        self.model.eval()
        running_loss = 0.0
        all_preds = []
        all_labels = []

        pbar = tqdm(self.val_loader, desc="Validating", leave=False)
        for inputs, labels in pbar:
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            if self.use_amp:
                with autocast():
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, labels)
            else:
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)

            running_loss += loss.item() * inputs.size(0)
            preds = outputs.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

        avg_loss = running_loss / len(self.val_loader.dataset)
        accuracy = np.mean(np.array(all_preds) == np.array(all_labels))
        f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

        return avg_loss, accuracy, f1

    def train(self, num_epochs=None, freeze_epochs=None, unfreeze_layers=None):
        """
        Run the complete two-stage training pipeline.

        Stage 1: Train classifier head only (backbone frozen).
        Stage 2: Gradually unfreeze backbone layers and fine-tune.

        Args:
            num_epochs: Total training epochs.
            freeze_epochs: Epochs for stage 1 (head-only training).
            unfreeze_layers: Number of backbone blocks to unfreeze in stage 2.

        Returns:
            dict: Training history.
        """
        num_epochs = num_epochs or config.NUM_EPOCHS
        freeze_epochs = freeze_epochs or config.FREEZE_EPOCHS
        unfreeze_layers = unfreeze_layers or config.UNFREEZE_LAYERS

        trainable, total = count_parameters(self.model)
        self.logger.info(f"Model parameters: {total:,} total")

        start_time = time.time()

        # ==========================================
        # STAGE 1: Train classifier head only
        # ==========================================
        print_separator("STAGE 1: Classifier Head Training")
        self.model.freeze_backbone()
        trainable, _ = count_parameters(self.model)
        self.logger.info(f"Trainable parameters (head only): {trainable:,}")

        self._setup_optimizer(stage="head", num_epochs=freeze_epochs)

        for epoch in range(freeze_epochs):
            epoch_start = time.time()
            train_loss, train_acc, train_f1 = self.train_epoch()
            val_loss, val_acc, val_f1 = self.validate()
            epoch_time = time.time() - epoch_start

            self._log_epoch(epoch + 1, train_loss, val_loss, train_acc, val_acc,
                            train_f1, val_f1, epoch_time)

            # Memory cleanup & per-epoch checkpoint
            gc.collect()
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            self._save_checkpoint(epoch + 1)

        # ==========================================
        # STAGE 2: Fine-tune backbone
        # ==========================================
        print_separator("STAGE 2: Backbone Fine-tuning")
        self.model.unfreeze_layers(n=unfreeze_layers)
        trainable, _ = count_parameters(self.model)
        self.logger.info(f"Trainable parameters (fine-tune): {trainable:,}")

        # Purge Stage 1 optimizer memory before allocating Stage 2 optimizer
        if hasattr(self, "optimizer"):
            del self.optimizer
        if hasattr(self, "scheduler"):
            del self.scheduler
        gc.collect()
        if self.device.type == "cuda":
            torch.cuda.empty_cache()

        finetune_epochs = num_epochs - freeze_epochs
        self._setup_optimizer(stage="finetune", num_epochs=finetune_epochs)

        # Reset early stopping for fine-tuning stage
        self.early_stopping = EarlyStopping(mode="max")

        for epoch in range(freeze_epochs, num_epochs):
            epoch_start = time.time()
            train_loss, train_acc, train_f1 = self.train_epoch()
            val_loss, val_acc, val_f1 = self.validate()
            epoch_time = time.time() - epoch_start

            self._log_epoch(epoch + 1, train_loss, val_loss, train_acc, val_acc,
                            train_f1, val_f1, epoch_time)

            # Update diagnostics
            self.diagnostics.update(train_loss, val_loss, train_acc, val_acc)
            diagnosis = self.diagnostics.diagnose()
            if diagnosis["status"] != "healthy":
                self.logger.warning(f"  Diagnosis: {diagnosis['message']}")
                for rec in diagnosis["recommendations"][:2]:
                    self.logger.warning(f"    → {rec}")

            # Memory cleanup & per-epoch checkpoint
            gc.collect()
            if self.device.type == "cuda":
                torch.cuda.empty_cache()
            self._save_checkpoint(epoch + 1)

            # Early stopping
            if self.early_stopping(val_f1, self.model, epoch + 1):
                self.logger.info(f"Early stopping triggered at epoch {epoch + 1}")
                self.logger.info(f"Best epoch: {self.early_stopping.best_epoch}")
                break

        # Training summary
        total_time = time.time() - start_time
        print_separator("TRAINING COMPLETE")
        self.logger.info(f"Total training time: {format_duration(total_time)}")
        self.logger.info(f"Best validation F1: {max(self.history['val_f1']):.4f}")
        self.logger.info(f"Best epoch: {self.early_stopping.best_epoch}")

        # Save history
        self._save_history()

        return self.history

    def _log_epoch(self, epoch, train_loss, val_loss, train_acc, val_acc,
                   train_f1, val_f1, epoch_time=None):
        """Log epoch metrics and update history."""
        current_lr = self.optimizer.param_groups[-1]["lr"]

        self.history["train_loss"].append(train_loss)
        self.history["val_loss"].append(val_loss)
        self.history["train_acc"].append(train_acc)
        self.history["val_acc"].append(val_acc)
        self.history["train_f1"].append(train_f1)
        self.history["val_f1"].append(val_f1)
        self.history["lr"].append(current_lr)

        time_str = f" | Time: {epoch_time:.1f}s" if epoch_time else ""
        self.logger.info(
            f"Epoch {epoch:3d} | "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f} | "
            f"Train F1: {train_f1:.4f} | Val F1: {val_f1:.4f} | "
            f"LR: {current_lr:.6f}{time_str}"
        )

    def _save_checkpoint(self, epoch):
        """Save training checkpoint to disk."""
        os.makedirs(config.MODELS_OUTPUT_DIR, exist_ok=True)
        checkpoint_path = os.path.join(config.MODELS_OUTPUT_DIR, "checkpoint_latest.pth")
        try:
            torch.save({
                "epoch": epoch,
                "model_state_dict": self.model.state_dict(),
                "optimizer_state_dict": self.optimizer.state_dict(),
                "history": self.history,
            }, checkpoint_path)
        except Exception as e:
            self.logger.warning(f"Could not save checkpoint: {e}")

    def _save_history(self):
        """Save training history to JSON."""
        os.makedirs(config.MODELS_OUTPUT_DIR, exist_ok=True)
        history_path = config.TRAINING_HISTORY_PATH
        with open(history_path, "w") as f:
            json.dump(self.history, f, indent=2)
        self.logger.info(f"Saved training history to: {history_path}")
