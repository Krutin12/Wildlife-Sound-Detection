"""
Phase 13: Model Saving
=======================
Saves all artifacts needed for inference:
- Trained model state dict
- Label encoder
- Class mapping
- Model configuration

Usage:
    from src.phase13_saving import save_model_artifacts, load_model_artifacts
    save_model_artifacts(model, label_processor, config_dict)
"""

import json
import os
import pickle
import sys

import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator


def save_model_artifacts(model, label_processor, training_config=None, logger=None):
    """
    Save all model artifacts needed for inference.
    
    Saves:
        - best_model.pth: Model state dict
        - label_encoder.pkl: Scikit-learn LabelEncoder
        - class_mapping.json: Label-to-index mapping
        - model_config.json: Model architecture and training config
    
    Args:
        model: Trained BirdCLEFModel.
        label_processor: Fitted LabelProcessor.
        training_config: Optional dict of training configuration.
        logger: Logger instance.
    """
    logger = logger or setup_logging()
    os.makedirs(config.MODELS_OUTPUT_DIR, exist_ok=True)

    print_separator("PHASE 13: SAVING MODEL ARTIFACTS")

    # 1. Save model state dict
    model_path = config.BEST_MODEL_PATH
    torch.save(model.state_dict(), model_path)
    logger.info(f"Saved model to: {model_path}")

    # 2. Save label encoder
    label_processor.save()
    logger.info(f"Saved label encoder to: {config.LABEL_ENCODER_PATH}")
    logger.info(f"Saved class mapping to: {config.CLASS_MAPPING_PATH}")

    # 3. Save model configuration
    model_config = {
        "model_name": config.MODEL_NAME,
        "num_classes": label_processor.num_classes,
        "dropout_rate": config.DROPOUT_RATE,
        "sample_rate": config.SAMPLE_RATE,
        "audio_duration": config.AUDIO_DURATION,
        "n_fft": config.N_FFT,
        "hop_length": config.HOP_LENGTH,
        "n_mels": config.N_MELS,
        "fmin": config.F_MIN,
        "fmax": config.F_MAX,
    }

    if training_config:
        model_config["training"] = training_config

    config_path = config.MODEL_CONFIG_PATH
    with open(config_path, "w") as f:
        json.dump(model_config, f, indent=2)
    logger.info(f"Saved model config to: {config_path}")

    # List all saved files
    logger.info("\nSaved artifacts:")
    for fname in os.listdir(config.MODELS_OUTPUT_DIR):
        fpath = os.path.join(config.MODELS_OUTPUT_DIR, fname)
        size_mb = os.path.getsize(fpath) / (1024 * 1024)
        logger.info(f"  {fname}: {size_mb:.1f} MB")


def load_model_artifacts(device=None, logger=None):
    """
    Load all saved model artifacts for inference.
    
    Returns:
        tuple: (model, label_processor, model_config)
    """
    from src.phase06_labels import LabelProcessor
    from src.phase08_model import build_model

    logger = logger or setup_logging()
    device = device or config.DEVICE

    # Load config
    with open(config.MODEL_CONFIG_PATH, "r") as f:
        model_config = json.load(f)

    # Load label processor
    label_processor = LabelProcessor()
    label_processor.load()

    # Build and load model
    model = build_model(num_classes=label_processor.num_classes, device=device)
    model.load_state_dict(
        torch.load(config.BEST_MODEL_PATH, map_location=device)
    )
    model.eval()

    logger.info(f"Loaded model ({label_processor.num_classes} classes) on {device}")
    return model, label_processor, model_config
