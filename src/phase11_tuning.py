"""
Phase 11: Hyperparameter Tuning
=================================
Uses Optuna to optimize hyperparameters:
- Learning Rate
- Batch Size
- Dropout
- Weight Decay
- Number of Fine-Tuned Layers

Objective: Maximize validation F1-score.

Usage:
    python scripts/run_tuning.py [--n-trials 30]
"""

import json
import os
import sys
import time

import numpy as np
import optuna
import torch
import torch.nn as nn
from sklearn.metrics import f1_score
from torch.cuda.amp import GradScaler, autocast
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator


def objective(trial, train_df, val_df, label_processor, logger):
    """
    Optuna objective function for hyperparameter optimization.
    
    Args:
        trial: Optuna trial object.
        train_df: Training dataframe.
        val_df: Validation dataframe.
        label_processor: Fitted LabelProcessor.
        logger: Logger instance.
    
    Returns:
        float: Validation F1-score.
    """
    from src.dataset import BirdCLEFDataset
    from src.phase08_model import BirdCLEFModel
    from torch.utils.data import DataLoader

    # Suggest hyperparameters
    lr = trial.suggest_float("learning_rate", 1e-5, 1e-2, log=True)
    batch_size = trial.suggest_categorical("batch_size", [16, 32, 64])
    dropout = trial.suggest_float("dropout", 0.2, 0.6, step=0.05)
    weight_decay = trial.suggest_float("weight_decay", 1e-6, 1e-2, log=True)
    unfreeze_layers = trial.suggest_int("unfreeze_layers", 1, 5)

    logger.info(f"Trial {trial.number}: lr={lr:.6f}, batch={batch_size}, "
                f"dropout={dropout:.2f}, wd={weight_decay:.6f}, unfreeze={unfreeze_layers}")

    # Create dataloaders
    train_dataset = BirdCLEFDataset(train_df, label_processor, mode="train")
    val_dataset = BirdCLEFDataset(val_df, label_processor, mode="val")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True,
                              num_workers=config.NUM_WORKERS, pin_memory=True, drop_last=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False,
                            num_workers=config.NUM_WORKERS, pin_memory=True)

    # Build model
    model = BirdCLEFModel(
        num_classes=label_processor.num_classes,
        dropout_rate=dropout,
    ).to(config.DEVICE)

    # Unfreeze layers and setup optimizer
    model.unfreeze_layers(n=unfreeze_layers)

    optimizer = torch.optim.AdamW(
        model.get_parameter_groups(lr_head=lr, lr_backbone=lr * 0.1),
        weight_decay=weight_decay,
    )
    criterion = nn.CrossEntropyLoss()
    use_amp = config.USE_MIXED_PRECISION and config.DEVICE.type == "cuda"
    scaler = GradScaler() if use_amp else None

    # Train for reduced epochs
    for epoch in range(config.OPTUNA_TUNING_EPOCHS):
        model.train()
        for inputs, labels in train_loader:
            inputs = inputs.to(config.DEVICE)
            labels = labels.to(config.DEVICE)
            optimizer.zero_grad()

            if use_amp:
                with autocast():
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

        # Validate
        model.eval()
        all_preds, all_labels = [], []
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(config.DEVICE)
                outputs = model(inputs)
                preds = outputs.argmax(dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.numpy())

        val_f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)

        # Report intermediate value for pruning
        trial.report(val_f1, epoch)
        if trial.should_prune():
            raise optuna.TrialPruned()

    logger.info(f"Trial {trial.number} finished: val_f1={val_f1:.4f}")
    return val_f1


def run_tuning(n_trials=None, train_df=None, val_df=None, label_processor=None):
    """
    Run Optuna hyperparameter tuning.
    
    Args:
        n_trials: Number of Optuna trials.
        train_df: Training dataframe (loaded from splits if None).
        val_df: Validation dataframe (loaded from splits if None).
        label_processor: Fitted LabelProcessor (loaded if None).
    
    Returns:
        dict: Best hyperparameters.
    """
    config.create_output_dirs()
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "tuning.log")
    )
    n_trials = n_trials or config.OPTUNA_N_TRIALS

    print_separator("PHASE 11: HYPERPARAMETER TUNING (Optuna)")

    # Load data if not provided
    if train_df is None or val_df is None:
        import pandas as pd
        from src.phase07_splitting import load_splits
        train_df, val_df, _ = load_splits()

    if label_processor is None:
        from src.phase06_labels import LabelProcessor
        label_processor = LabelProcessor()
        label_processor.load()

    # Create study
    study = optuna.create_study(
        direction="maximize",
        study_name="birdclef_hpo",
        pruner=optuna.pruners.MedianPruner(n_startup_trials=5),
    )

    study.optimize(
        lambda trial: objective(trial, train_df, val_df, label_processor, logger),
        n_trials=n_trials,
        timeout=config.OPTUNA_TIMEOUT,
        show_progress_bar=True,
    )

    # Save results
    best_params = study.best_params
    results = {
        "best_params": best_params,
        "best_value": study.best_value,
        "n_trials": len(study.trials),
    }

    results_path = os.path.join(config.TUNING_OUTPUT_DIR, "best_params.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)

    logger.info(f"Best F1: {study.best_value:.4f}")
    logger.info(f"Best params: {best_params}")
    logger.info(f"Results saved to: {results_path}")

    return best_params


if __name__ == "__main__":
    run_tuning()
