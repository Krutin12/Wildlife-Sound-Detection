"""
Animal Sound Identification System - Central Configuration
===========================================================
All hyperparameters, paths, and settings for the BirdCLEF 2026 pipeline.
"""

import os
import torch

# ============================================================
# BASE PATHS
# ============================================================
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Dataset paths - check Colab local storage first, fallback to local project root
data_dir = r"C:\Users\krutin_12\Desktop\WildLIfe-Detection\birdclef-2026"
if os.path.exists(os.path.join(data_dir, "train.csv")):
    DATASET_DIR = data_dir
else:
    DATASET_DIR = os.path.join(PROJECT_ROOT, "data", "birdclef-2026")

TRAIN_CSV = os.path.join(DATASET_DIR, "train.csv")
TAXONOMY_CSV = os.path.join(DATASET_DIR, "taxonomy.csv")
TRAIN_AUDIO_DIR = os.path.join(DATASET_DIR, "train_audio")

# Output directories
OUTPUTS_DIR = os.path.join(PROJECT_ROOT, "outputs")
EDA_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "eda")
CLEANED_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "cleaned")
FEATURES_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "features")
MODELS_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "models")
EVALUATION_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "evaluation")
TUNING_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "tuning")
LOGS_OUTPUT_DIR = os.path.join(OUTPUTS_DIR, "logs")

# Database
DATABASE_DIR = os.path.join(PROJECT_ROOT, "database")
DATABASE_PATH = os.path.join(DATABASE_DIR, "animal_info.db")

# ============================================================
# AUDIO PARAMETERS
# ============================================================
SAMPLE_RATE = 32000          # Hz
AUDIO_DURATION = 5           # seconds
AUDIO_LENGTH = SAMPLE_RATE * AUDIO_DURATION  # 160000 samples

# ============================================================
# FEATURE EXTRACTION (Log-Mel Spectrogram)
# ============================================================
N_FFT = 1024
HOP_LENGTH = 240
N_MELS = 256
F_MIN = 20                   # Hz
F_MAX = 16000                # Hz

# ============================================================
# SILENCE REMOVAL
# ============================================================
SILENCE_THRESHOLD_DB = -40   # dB below peak for silence detection
MIN_SILENCE_DURATION = 0.5   # seconds - only remove silences longer than this

# ============================================================
# DATA SPLITTING
# ============================================================
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
RANDOM_SEED = 42

# ============================================================
# DATA CLEANING
# ============================================================
MIN_RATING = 3               # Keep recordings with rating >= this value

# ============================================================
# DATA AUGMENTATION (training only)
# ============================================================
AUGMENTATION_CONFIG = {
    "time_shift_max": 0.2,        # max shift as fraction of audio length
    "pitch_shift_range": (-2, 2), # semitones
    "time_stretch_range": (0.8, 1.2),
    "random_gain_range": (-6, 6), # dB
    "noise_factor": 0.005,        # Gaussian noise amplitude
    "spec_augment": {
        "freq_mask_param": 15,    # max frequency bands to mask
        "time_mask_param": 25,    # max time steps to mask
        "num_freq_masks": 2,
        "num_time_masks": 2,
    },
}

# ============================================================
# MODEL
# ============================================================
MODEL_NAME = "efficientnet_b3"
PRETRAINED = True
DROPOUT_RATE = 0.4

# ============================================================
# TRAINING
# ============================================================
BATCH_SIZE = 128
NUM_EPOCHS = 20
LEARNING_RATE_HEAD = 1e-3      # For classifier head
LEARNING_RATE_FINETUNE = 1e-4  # For backbone fine-tuning
WEIGHT_DECAY = 1e-4            # L2 regularization
NUM_WORKERS = 4                # DataLoader workers
PIN_MEMORY = True
PERSISTENT_WORKERS = True
PREFETCH_FACTOR = 2

# Early Stopping
EARLY_STOPPING_PATIENCE = 7
EARLY_STOPPING_MIN_DELTA = 1e-4

# Learning Rate Scheduler
SCHEDULER_TYPE = "cosine"      # "cosine" or "plateau"
COSINE_T_MAX = 10              # For CosineAnnealingWarmRestarts
PLATEAU_FACTOR = 0.5           # For ReduceLROnPlateau
PLATEAU_PATIENCE = 3

# Fine-tuning schedule
FREEZE_EPOCHS = 1              # Train whole model from epoch 1 for full GPU utilization
UNFREEZE_LAYERS = 5            # Number of backbone blocks to unfreeze

# Mixed Precision
USE_MIXED_PRECISION = True

# ============================================================
# HYPERPARAMETER TUNING (Optuna)
# ============================================================
OPTUNA_N_TRIALS = 30
OPTUNA_TIMEOUT = 3600 * 6     # 6 hours max
OPTUNA_TUNING_EPOCHS = 10     # Fewer epochs for faster trials

# ============================================================
# DEVICE
# ============================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
USE_GPU = torch.cuda.is_available()

# ============================================================
# SAVED MODEL FILES
# ============================================================
BEST_MODEL_PATH = os.path.join(MODELS_OUTPUT_DIR, "best_model.pth")
LABEL_ENCODER_PATH = os.path.join(MODELS_OUTPUT_DIR, "label_encoder.pkl")
CLASS_MAPPING_PATH = os.path.join(MODELS_OUTPUT_DIR, "class_mapping.json")
MODEL_CONFIG_PATH = os.path.join(MODELS_OUTPUT_DIR, "model_config.json")
TRAINING_HISTORY_PATH = os.path.join(MODELS_OUTPUT_DIR, "training_history.json")

# ============================================================
# UTILITY FUNCTIONS
# ============================================================
def create_output_dirs():
    """Create all output directories if they don't exist."""
    dirs = [
        EDA_OUTPUT_DIR, CLEANED_OUTPUT_DIR, FEATURES_OUTPUT_DIR,
        MODELS_OUTPUT_DIR, EVALUATION_OUTPUT_DIR, TUNING_OUTPUT_DIR,
        LOGS_OUTPUT_DIR, DATABASE_DIR,
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def get_device_info():
    """Print device information."""
    print(f"Device: {DEVICE}")
    if USE_GPU:
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        print("WARNING: No GPU detected. Training will be slow.")
    return DEVICE
