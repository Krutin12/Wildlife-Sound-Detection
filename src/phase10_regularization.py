"""
Phase 10: Overfitting / Underfitting Prevention
=================================================
Utilities for regularization, early stopping, and training diagnostics.

Components:
    - EarlyStopping: Stops training when validation metric stops improving.
    - TrainingDiagnostics: Monitors train/val gaps and provides recommendations.

Usage:
    from src.phase10_regularization import EarlyStopping, TrainingDiagnostics
    early_stopper = EarlyStopping(patience=7)
    diagnostics = TrainingDiagnostics()
"""

import os
import sys

import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class EarlyStopping:
    """
    Early stopping to halt training when validation metric stops improving.
    
    Monitors a metric (e.g., validation loss or F1-score) and triggers
    stopping after 'patience' epochs without improvement.
    
    Args:
        patience: Number of epochs to wait for improvement.
        min_delta: Minimum change to qualify as improvement.
        mode: 'min' for loss, 'max' for accuracy/F1.
        save_path: Path to save the best model checkpoint.
    """

    def __init__(self, patience=None, min_delta=None, mode="min", save_path=None):
        self.patience = patience or config.EARLY_STOPPING_PATIENCE
        self.min_delta = min_delta or config.EARLY_STOPPING_MIN_DELTA
        self.mode = mode
        self.save_path = save_path or config.BEST_MODEL_PATH
        
        self.counter = 0
        self.best_score = None
        self.should_stop = False
        self.best_epoch = 0

    def __call__(self, metric, model, epoch):
        """
        Check if training should stop.
        
        Args:
            metric: Current validation metric value.
            model: PyTorch model (saved if metric improved).
            epoch: Current epoch number.
        
        Returns:
            bool: True if training should stop.
        """
        score = -metric if self.mode == "min" else metric

        if self.best_score is None:
            self.best_score = score
            self._save_checkpoint(model)
            self.best_epoch = epoch
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
        else:
            self.best_score = score
            self._save_checkpoint(model)
            self.counter = 0
            self.best_epoch = epoch

        return self.should_stop

    def _save_checkpoint(self, model):
        """Save the model checkpoint."""
        os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
        torch.save(model.state_dict(), self.save_path)

    def get_status(self):
        """Get current early stopping status."""
        return {
            "counter": self.counter,
            "patience": self.patience,
            "best_epoch": self.best_epoch,
            "should_stop": self.should_stop,
        }


class TrainingDiagnostics:
    """
    Monitors training and validation metrics to detect overfitting/underfitting.
    
    Provides diagnostic recommendations based on the gap between
    training and validation metrics.
    """

    def __init__(self):
        self.train_losses = []
        self.val_losses = []
        self.train_accuracies = []
        self.val_accuracies = []

    def update(self, train_loss, val_loss, train_acc, val_acc):
        """
        Record metrics for the current epoch.
        
        Args:
            train_loss: Training loss.
            val_loss: Validation loss.
            train_acc: Training accuracy.
            val_acc: Validation accuracy.
        """
        self.train_losses.append(train_loss)
        self.val_losses.append(val_loss)
        self.train_accuracies.append(train_acc)
        self.val_accuracies.append(val_acc)

    def diagnose(self):
        """
        Analyze current training status and provide recommendations.
        
        Returns:
            dict: Diagnosis with 'status', 'message', and 'recommendations'.
        """
        if len(self.train_losses) < 3:
            return {
                "status": "insufficient_data",
                "message": "Need at least 3 epochs for diagnosis.",
                "recommendations": [],
            }

        train_loss = self.train_losses[-1]
        val_loss = self.val_losses[-1]
        train_acc = self.train_accuracies[-1]
        val_acc = self.val_accuracies[-1]

        loss_gap = val_loss - train_loss
        acc_gap = train_acc - val_acc

        # Check for overfitting
        if loss_gap > 0.5 or acc_gap > 0.15:
            return {
                "status": "overfitting",
                "message": f"Overfitting detected! Train-Val gap: Loss={loss_gap:.4f}, Acc={acc_gap:.4f}",
                "recommendations": [
                    "Increase dropout rate",
                    "Increase weight decay",
                    "Add more data augmentation",
                    "Reduce model complexity (fewer unfrozen layers)",
                    "Consider early stopping",
                ],
            }

        # Check for underfitting
        if train_acc < 0.3 and val_acc < 0.3:
            return {
                "status": "underfitting",
                "message": f"Underfitting detected! Train Acc={train_acc:.4f}, Val Acc={val_acc:.4f}",
                "recommendations": [
                    "Increase training epochs",
                    "Unfreeze more backbone layers",
                    "Increase learning rate",
                    "Reduce augmentation intensity",
                    "Increase model capacity",
                ],
            }

        # Check for learning stagnation
        if len(self.val_losses) >= 5:
            recent_losses = self.val_losses[-5:]
            if max(recent_losses) - min(recent_losses) < 0.01:
                return {
                    "status": "stagnation",
                    "message": "Validation loss has plateaued.",
                    "recommendations": [
                        "Reduce learning rate",
                        "Try a different optimizer",
                        "Unfreeze more layers",
                    ],
                }

        return {
            "status": "healthy",
            "message": f"Training appears healthy. Train Acc={train_acc:.4f}, Val Acc={val_acc:.4f}",
            "recommendations": [],
        }
