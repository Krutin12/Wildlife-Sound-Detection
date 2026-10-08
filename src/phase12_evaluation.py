"""
Phase 12: Model Evaluation
============================
Comprehensive model evaluation:
- Accuracy, Precision, Recall, F1-score
- Confusion Matrix
- Classification Report
- Training vs Validation Loss/Accuracy plots
- Misclassified species analysis

Usage:
    python scripts/run_evaluation.py
"""

import json
import os
import sys

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import torch
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score, precision_score,
                             recall_score)
from torch.cuda.amp import autocast
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator

plt.style.use("seaborn-v0_8-darkgrid")


def evaluate_model(model, test_loader, device=None, logger=None):
    """
    Evaluate the model on the test set.
    
    Args:
        model: Trained BirdCLEFModel.
        test_loader: Test DataLoader.
        device: Device for inference.
        logger: Logger instance.
    
    Returns:
        tuple: (all_preds, all_labels, all_probs) as numpy arrays.
    """
    device = device or config.DEVICE
    logger = logger or setup_logging()
    
    model.eval()
    all_preds = []
    all_labels = []
    all_probs = []

    use_amp = config.USE_MIXED_PRECISION and device.type == "cuda"

    logger.info("Running model evaluation on test set...")
    with torch.no_grad():
        for inputs, labels in tqdm(test_loader, desc="Evaluating"):
            inputs = inputs.to(device, non_blocking=True)

            if use_amp:
                with autocast():
                    outputs = model(inputs)
            else:
                outputs = model(inputs)

            probs = torch.softmax(outputs, dim=1)
            preds = outputs.argmax(dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    return np.array(all_preds), np.array(all_labels), np.array(all_probs)


def compute_metrics(all_preds, all_labels, label_processor, logger=None):
    """
    Compute classification metrics.
    
    Args:
        all_preds: Predicted class indices.
        all_labels: True class indices.
        label_processor: LabelProcessor for decoding.
        logger: Logger instance.
    
    Returns:
        dict: Dictionary of metric scores.
    """
    logger = logger or setup_logging()

    accuracy = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, average="macro", zero_division=0)
    recall = recall_score(all_labels, all_preds, average="macro", zero_division=0)
    f1 = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    f1_weighted = f1_score(all_labels, all_preds, average="weighted", zero_division=0)

    metrics = {
        "accuracy": float(accuracy),
        "precision_macro": float(precision),
        "recall_macro": float(recall),
        "f1_macro": float(f1),
        "f1_weighted": float(f1_weighted),
    }

    print_separator("EVALUATION METRICS")
    logger.info(f"Accuracy:         {accuracy:.4f}")
    logger.info(f"Precision (macro): {precision:.4f}")
    logger.info(f"Recall (macro):    {recall:.4f}")
    logger.info(f"F1 (macro):        {f1:.4f}")
    logger.info(f"F1 (weighted):     {f1_weighted:.4f}")

    return metrics


def plot_confusion_matrix(all_preds, all_labels, label_processor, top_n=30, logger=None):
    """
    Plot confusion matrix for the most common classes.
    
    Args:
        all_preds: Predicted class indices.
        all_labels: True class indices.
        label_processor: LabelProcessor.
        top_n: Number of top classes to include in the plot.
        logger: Logger instance.
    """
    logger = logger or setup_logging()

    # Get most common classes
    unique, counts = np.unique(all_labels, return_counts=True)
    top_classes = unique[np.argsort(-counts)[:top_n]]

    # Filter to top classes
    mask = np.isin(all_labels, top_classes)
    filtered_preds = all_preds[mask]
    filtered_labels = all_labels[mask]

    # Get class names
    class_names = [label_processor.decode_single(c) for c in top_classes]

    cm = confusion_matrix(filtered_labels, filtered_preds, labels=top_classes)

    fig, ax = plt.subplots(figsize=(20, 18))
    sns.heatmap(cm, annot=False, fmt="d", cmap="YlOrRd",
                xticklabels=class_names, yticklabels=class_names, ax=ax)
    ax.set_title(f"Confusion Matrix (Top {top_n} Species)", fontsize=16, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True", fontsize=12)
    plt.xticks(rotation=90, fontsize=7)
    plt.yticks(rotation=0, fontsize=7)

    plt.tight_layout()
    save_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "confusion_matrix.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved confusion matrix to: {save_path}")


def plot_training_history(history=None, logger=None):
    """
    Plot training vs validation loss and accuracy curves.
    
    Args:
        history: Training history dict (loaded from file if None).
        logger: Logger instance.
    """
    logger = logger or setup_logging()

    if history is None:
        history_path = config.TRAINING_HISTORY_PATH
        if not os.path.exists(history_path):
            logger.warning("No training history found. Skipping plots.")
            return
        with open(history_path, "r") as f:
            history = json.load(f)

    fig, axes = plt.subplots(1, 3, figsize=(20, 6))

    epochs = range(1, len(history["train_loss"]) + 1)

    # Loss plot
    axes[0].plot(epochs, history["train_loss"], "b-", label="Train Loss", linewidth=2)
    axes[0].plot(epochs, history["val_loss"], "r-", label="Val Loss", linewidth=2)
    axes[0].set_title("Training vs Validation Loss", fontsize=14, fontweight="bold")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # Accuracy plot
    axes[1].plot(epochs, history["train_acc"], "b-", label="Train Acc", linewidth=2)
    axes[1].plot(epochs, history["val_acc"], "r-", label="Val Acc", linewidth=2)
    axes[1].set_title("Training vs Validation Accuracy", fontsize=14, fontweight="bold")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    # F1 plot
    axes[2].plot(epochs, history["train_f1"], "b-", label="Train F1", linewidth=2)
    axes[2].plot(epochs, history["val_f1"], "r-", label="Val F1", linewidth=2)
    axes[2].set_title("Training vs Validation F1-Score", fontsize=14, fontweight="bold")
    axes[2].set_xlabel("Epoch")
    axes[2].set_ylabel("F1-Score (Macro)")
    axes[2].legend()
    axes[2].grid(True, alpha=0.3)

    plt.tight_layout()
    save_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "training_history.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved training history plots to: {save_path}")


def analyze_misclassifications(all_preds, all_labels, label_processor, top_n=20, logger=None):
    """
    Analyze the most frequently misclassified species.
    
    Args:
        all_preds: Predicted class indices.
        all_labels: True class indices.
        label_processor: LabelProcessor.
        top_n: Number of top misclassified species to show.
        logger: Logger instance.
    """
    logger = logger or setup_logging()

    print_separator("Misclassification Analysis")

    misclassified_mask = all_preds != all_labels
    misclassified_labels = all_labels[misclassified_mask]
    misclassified_preds = all_preds[misclassified_mask]

    total_misclassified = misclassified_mask.sum()
    logger.info(f"Total misclassified: {total_misclassified} / {len(all_labels)} "
                f"({total_misclassified / len(all_labels) * 100:.1f}%)")

    # Most frequently misclassified species
    unique, counts = np.unique(misclassified_labels, return_counts=True)
    sorted_idx = np.argsort(-counts)[:top_n]

    logger.info(f"\nTop {top_n} most misclassified species:")
    misclass_data = []
    for idx in sorted_idx:
        label = unique[idx]
        count = counts[idx]
        label_name = label_processor.decode_single(label)
        # Find what it's most confused with
        confused_mask = misclassified_labels == label
        confused_preds = misclassified_preds[confused_mask]
        most_confused_with = label_processor.decode_single(
            np.bincount(confused_preds).argmax()
        ) if len(confused_preds) > 0 else "N/A"

        logger.info(f"  {label_name}: {count} errors → most confused with: {most_confused_with}")
        misclass_data.append({
            "species": label_name,
            "errors": int(count),
            "confused_with": most_confused_with,
        })

    # Save misclassification report
    report_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "misclassification_report.json")
    with open(report_path, "w") as f:
        json.dump(misclass_data, f, indent=2)
    logger.info(f"Saved misclassification report to: {report_path}")


def save_classification_report(all_preds, all_labels, label_processor, logger=None):
    """
    Generate and save a full classification report.
    
    Args:
        all_preds: Predicted class indices.
        all_labels: True class indices.
        label_processor: LabelProcessor.
        logger: Logger instance.
    """
    logger = logger or setup_logging()

    # Get unique classes present in the data
    unique_classes = sorted(set(all_labels) | set(all_preds))
    target_names = [label_processor.decode_single(c) for c in unique_classes]

    report = classification_report(
        all_labels, all_preds,
        labels=unique_classes,
        target_names=target_names,
        zero_division=0,
        output_dict=True,
    )

    # Save as JSON
    report_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "classification_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Save as text
    report_text = classification_report(
        all_labels, all_preds,
        labels=unique_classes,
        target_names=target_names,
        zero_division=0,
    )
    report_text_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "classification_report.txt")
    with open(report_text_path, "w") as f:
        f.write(report_text)

    logger.info(f"Saved classification report to: {report_path}")


def run_evaluation(model=None, test_loader=None, label_processor=None):
    """
    Run the complete evaluation pipeline.
    
    Args:
        model: Trained model (loaded from checkpoint if None).
        test_loader: Test DataLoader (created if None).
        label_processor: LabelProcessor (loaded if None).
    """
    config.create_output_dirs()
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "evaluation.log")
    )

    print_separator("PHASE 12: MODEL EVALUATION")

    # Load label processor
    if label_processor is None:
        from src.phase06_labels import LabelProcessor
        label_processor = LabelProcessor()
        label_processor.load()

    # Load model
    if model is None:
        from src.phase08_model import build_model
        model = build_model(num_classes=label_processor.num_classes)
        model.load_state_dict(torch.load(config.BEST_MODEL_PATH, map_location=config.DEVICE))
        logger.info(f"Loaded model from: {config.BEST_MODEL_PATH}")

    # Create test loader
    if test_loader is None:
        from src.phase07_splitting import load_splits
        from src.dataset import BirdCLEFDataset
        from torch.utils.data import DataLoader

        _, _, test_df = load_splits()
        test_dataset = BirdCLEFDataset(test_df, label_processor, mode="test")
        test_loader = DataLoader(test_dataset, batch_size=config.BATCH_SIZE,
                                 num_workers=config.NUM_WORKERS, pin_memory=True)

    # Evaluate
    all_preds, all_labels, all_probs = evaluate_model(model, test_loader, logger=logger)

    # Compute metrics
    metrics = compute_metrics(all_preds, all_labels, label_processor, logger=logger)

    # Save metrics
    metrics_path = os.path.join(config.EVALUATION_OUTPUT_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    # Plots and reports
    plot_confusion_matrix(all_preds, all_labels, label_processor, logger=logger)
    plot_training_history(logger=logger)
    save_classification_report(all_preds, all_labels, label_processor, logger=logger)
    analyze_misclassifications(all_preds, all_labels, label_processor, logger=logger)

    print_separator("EVALUATION COMPLETE")
    logger.info(f"All outputs saved to: {config.EVALUATION_OUTPUT_DIR}")


if __name__ == "__main__":
    run_evaluation()
