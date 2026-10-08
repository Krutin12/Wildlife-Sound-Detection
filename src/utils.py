"""
Utility Functions
=================
Shared utilities for logging, seed setting, path management, and device detection.
"""

import os
import sys
import random
import logging
import numpy as np
import torch


def setup_logging(log_file=None, level=logging.INFO):
    """
    Configure logging for the application.
    
    Args:
        log_file: Optional path to log file. If None, logs to console only.
        level: Logging level (default: INFO).
    
    Returns:
        logging.Logger: Configured logger instance.
    """
    logger = logging.getLogger("wildlife")
    logger.setLevel(level)
    logger.handlers.clear()

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s - %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def set_seed(seed=42):
    """
    Set random seed for reproducibility across all libraries.
    
    Args:
        seed: Integer seed value.
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    os.environ["PYTHONHASHSEED"] = str(seed)


def get_project_root():
    """
    Get the project root directory.
    
    Returns:
        str: Absolute path to the project root.
    """
    # Navigate up from src/ to project root
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ensure_dir(path):
    """
    Create a directory if it doesn't exist.
    
    Args:
        path: Directory path to create.
    """
    os.makedirs(path, exist_ok=True)


def format_duration(seconds):
    """
    Format seconds into human-readable duration string.
    
    Args:
        seconds: Duration in seconds.
    
    Returns:
        str: Formatted duration (e.g., "2h 15m 30s").
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def count_parameters(model):
    """
    Count trainable and total parameters in a model.
    
    Args:
        model: PyTorch model.
    
    Returns:
        tuple: (trainable_params, total_params)
    """
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    return trainable, total


def print_separator(title="", char="=", width=70):
    """Print a formatted separator line with optional title."""
    if title:
        padding = (width - len(title) - 2) // 2
        print(f"\n{char * padding} {title} {char * padding}")
    else:
        print(char * width)
