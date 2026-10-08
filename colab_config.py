"""
=============================================================
🐦 Animal Sound Identification System — Google Colab Runner
=============================================================

This script is designed to run the ENTIRE project on Google Colab.

HOW TO USE:
-----------
1. Upload your `birdclef-2026.zip` to Google Drive.
2. Open Google Colab (https://colab.research.google.com).
3. Create a new notebook.
4. Upload this project folder to your Google Drive.
5. Copy-paste sections below into Colab cells and run them.

Each section below is marked with:
    # ============ CELL X ============
Copy each cell into a separate Colab cell.
"""

# ============ CELL 1: Mount Google Drive ============
# Run this cell first to connect your Google Drive

# from google.colab import drive
# drive.mount('/content/drive/MyDrive')

# print("✅ Google Drive mounted!")


# ============ CELL 2: Setup Project ============
# Clone or copy the project, install dependencies

import os

# ============================================================
# 🔧 CONFIGURE THESE PATHS
# ============================================================
# Path to your project folder on Google Drive
PROJECT_DIR = "/content/drive/MyDrive/wildlife (1)"

# Path to your dataset zip on Google Drive
DATASET_ZIP = "/content/drive/MyDrive/wildlife (1)/birdclef-2026.zip"

# Working directory on Colab (fast local storage)
WORK_DIR = "/content/wildlife"
# ============================================================

# Copy project to local storage for faster I/O
import shutil

if os.path.exists(PROJECT_DIR):
    os.makedirs(WORK_DIR, exist_ok=True)
    for item in os.listdir(PROJECT_DIR):
        if item not in ["data", "outputs", "venv", ".git", "birdclef-2026.zip"]:
            src_path = os.path.join(PROJECT_DIR, item)
            dst_path = os.path.join(WORK_DIR, item)
            if os.path.isdir(src_path):
                if os.path.exists(dst_path):
                    shutil.rmtree(dst_path)
                shutil.copytree(src_path, dst_path)
            else:
                shutil.copy2(src_path, dst_path)
    os.chdir(WORK_DIR)
    print(f"✅ Project copied to: {WORK_DIR}")
    print(f"📁 Contents: {os.listdir(WORK_DIR)}")
else:
    print(f"⚠️ Warning: PROJECT_DIR not found at {PROJECT_DIR}")
    print("Ensure Google Drive is mounted or update PROJECT_DIR path.")


# ============ CELL 3: Install Dependencies ============

!pip install -q torch torchvision torchaudio timm
!pip install -q librosa soundfile audiomentations
!pip install -q pandas numpy scikit-learn
!pip install -q matplotlib seaborn
!pip install -q optuna
!pip install -q fastapi uvicorn python-multipart pydantic
!pip install -q streamlit
!pip install -q tqdm joblib

print("✅ All dependencies installed!")


# ============ CELL 4: Extract Dataset ============

import zipfile
import shutil

DATASET_DIR = os.path.join(WORK_DIR, "data", "birdclef-2026")
os.makedirs(DATASET_DIR, exist_ok=True)

train_csv_path = os.path.join(DATASET_DIR, "train.csv")

if not os.path.exists(train_csv_path):
    print(f"📦 Extracting dataset from: {DATASET_ZIP}")
    print("⏳ This may take a few minutes for large datasets...")

    with zipfile.ZipFile(DATASET_ZIP, 'r') as zip_ref:
        zip_ref.extractall(DATASET_DIR)

    # Check for nested folder (e.g., DATASET_DIR/birdclef-2026)
    nested_dir = os.path.join(DATASET_DIR, "birdclef-2026")
    if os.path.exists(nested_dir) and os.path.isdir(nested_dir):
        print("🔄 Fixing nested folder structure...")
        for item in os.listdir(nested_dir):
            shutil.move(os.path.join(nested_dir, item), os.path.join(DATASET_DIR, item))
        os.rmdir(nested_dir)

    print("✅ Dataset extracted!")
else:
    print("✅ Dataset already extracted!")

# Verify structure
print(f"\n📁 Dataset contents ({DATASET_DIR}):")
if os.path.exists(DATASET_DIR):
    for item in sorted(os.listdir(DATASET_DIR)):
        full_path = os.path.join(DATASET_DIR, item)
        if os.path.isdir(full_path):
            n_files = len(os.listdir(full_path))
            print(f"  📂 {item}/ ({n_files} items)")
        else:
            size_mb = os.path.getsize(full_path) / (1024*1024)
            print(f"  📄 {item} ({size_mb:.1f} MB)")
else:
    print(f"⚠️ Warning: Dataset directory not found at {DATASET_DIR}")


# ============ CELL 5: Configure Paths for Colab ============

import sys
import os
import torch

for p in [WORK_DIR, PROJECT_DIR]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

if os.path.exists(WORK_DIR):
    os.chdir(WORK_DIR)

# Update config.py files in both WORK_DIR and PROJECT_DIR
for base_dir in [WORK_DIR, PROJECT_DIR]:
    cfg_file = os.path.join(base_dir, "config.py")
    if os.path.exists(cfg_file):
        content = open(cfg_file, "r").read()
        content = content.replace('NUM_WORKERS = 4', 'NUM_WORKERS = 2')
        with open(cfg_file, "w") as f:
            f.write(content)

import config

# Set dynamic dataset paths in live module
config.DATASET_DIR = DATASET_DIR
config.TRAIN_CSV = os.path.join(DATASET_DIR, "train.csv")
config.TAXONOMY_CSV = os.path.join(DATASET_DIR, "taxonomy.csv")
config.TRAIN_AUDIO_DIR = os.path.join(DATASET_DIR, "train_audio")
config.NUM_WORKERS = 2
config.BATCH_SIZE = 64
config.PERSISTENT_WORKERS = True
config.PREFETCH_FACTOR = 2

print(f"\n🔧 Configuration:")
print(f"  DATASET_DIR:   {config.DATASET_DIR}")
print(f"  TRAIN_CSV:     {config.TRAIN_CSV} (exists: {os.path.exists(config.TRAIN_CSV)})")
print(f"  TAXONOMY_CSV:  {config.TAXONOMY_CSV} (exists: {os.path.exists(config.TAXONOMY_CSV)})")
print(f"  TRAIN_AUDIO:   {config.TRAIN_AUDIO_DIR} (exists: {os.path.exists(config.TRAIN_AUDIO_DIR)})")
print(f"  DEVICE:        {config.DEVICE}")
print(f"  GPU:           {'✅ ' + torch.cuda.get_device_name(0) if config.USE_GPU else '❌ CPU only'}")

if torch.cuda.is_available():
    print(f"  GPU Memory:    {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")


# ============ CELL 6: Phase 1 — EDA ============

import importlib
import sys
import os

for p in [WORK_DIR, PROJECT_DIR]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

if os.path.exists(WORK_DIR):
    os.chdir(WORK_DIR)
elif os.path.exists(PROJECT_DIR):
    os.chdir(PROJECT_DIR)

# Reload modules to pick up file changes
for mod_name in list(sys.modules.keys()):
    if mod_name.startswith("src") or mod_name == "config":
        try:
            importlib.reload(sys.modules[mod_name])
        except Exception:
            pass

from src.phase01_eda import run_eda
run_eda()

print("\n✅ EDA complete! Check outputs/eda/ for plots.")

# Display EDA plots inline
import matplotlib.pyplot as plt
from IPython.display import display, Image as IPImage
import glob

eda_plots = glob.glob(os.path.join(WORK_DIR, "outputs", "eda", "*.png"))
for plot_path in eda_plots:
    print(f"\n📊 {os.path.basename(plot_path)}")
    display(IPImage(filename=plot_path))


# ============ CELL 7: Phase 2 — Data Cleaning ============

from src.phase02_cleaning import run_cleaning
cleaned_df = run_cleaning()

print(f"\n✅ Phase 2 Cleaning complete!")
print(f"  Records: {len(cleaned_df)}")
print(f"  Species: {cleaned_df['primary_label'].nunique()}")


# ============ CELL 8: Phase 3, 4, 5 — Audio Preprocessing & Spectrogram Extraction ============
# Test & verify Audio Preprocessing (Phase 3), Data Augmentation (Phase 4),
# and Log-Mel Spectrogram Extraction (Phase 5) on dataset audio files.

import numpy as np
import matplotlib.pyplot as plt
from src.phase03_preprocessing import AudioPreprocessor
from src.phase04_augmentation import AudioAugmentor
from src.phase05_features import MelSpectrogramExtractor

print("🎵 Running Phase 3: Audio Preprocessing...")
preprocessor = AudioPreprocessor(mode="train")

sample_file = cleaned_df.iloc[0]["filename"]
sample_path = os.path.join(config.TRAIN_AUDIO_DIR, sample_file)

waveform = preprocessor.process(sample_path)
print(f"  Sample file: {sample_file}")
print(f"  Processed waveform shape: {waveform.shape} (32,000 Hz x 5s = 160,000 samples)")
print(f"  Peak normalized max value: {np.max(np.abs(waveform)):.4f}")

print("\n🔊 Running Phase 4: Data Augmentation...")
augmentor = AudioAugmentor()
aug_waveform = augmentor.augment(waveform)
print(f"  Augmented waveform shape: {aug_waveform.shape}")

print("\n📊 Running Phase 5: Log-Mel Spectrogram Extraction...")
extractor = MelSpectrogramExtractor()
spectrogram = extractor.extract(aug_waveform)
print(f"  Extracted Spectrogram shape: {spectrogram.shape} (128 Mel bands x 501 Time frames)")

fig, ax = plt.subplots(figsize=(10, 4))
im = ax.imshow(spectrogram, aspect="auto", origin="lower", cmap="magma")
ax.set_title(f"Phase 5 Log-Mel Spectrogram: {sample_file}", fontsize=12, fontweight="bold")
ax.set_xlabel("Time Frames")
ax.set_ylabel("Mel Frequency Bins")
plt.colorbar(im, ax=ax, format="%+2.0f dB")
plt.tight_layout()
plt.show()

print("✅ Phase 3, 4 & 5 Preprocessing Verification Complete!")


# ============ CELL 9: Phase 6, 7, 15 — Label Encoding, Dataset Splitting & Database ============

# Phase 6: Label Encoding
from src.phase06_labels import LabelProcessor

label_processor = LabelProcessor()
label_processor.fit(cleaned_df["primary_label"].values)
label_processor.save()
print(f"✅ Phase 6 Labels encoded: {label_processor.num_classes} classes")

# Phase 7: Dataset Splitting
from src.phase07_splitting import split_dataset, save_splits

train_df, val_df, test_df = split_dataset(cleaned_df)
save_splits(train_df, val_df, test_df)
print(f"✅ Phase 7 Split complete: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

# Phase 15: Animal Database
from src.phase15_database import AnimalDatabase

db = AnimalDatabase()
db.build_from_taxonomy()
db.close()
print("✅ Phase 15 Animal info database built!")

# ============ CELL 9.5: Pre-Compute Spectrogram Cache (Run Once) ============
# ⚡ This converts ~22 min/epoch → ~3-4 min/epoch by caching spectrograms!

import pandas as pd
from src.precompute_cache import precompute_spectrograms

print("⚡ Pre-computing spectrogram cache (only runs once)...")
# Combine all splits so every audio file is cached
all_df = pd.concat([train_df, val_df, test_df], ignore_index=True)
CACHE_DIR = os.path.join(WORK_DIR, "outputs", "spec_cache")
precompute_spectrograms(all_df, cache_dir=CACHE_DIR, audio_dir=config.TRAIN_AUDIO_DIR)
print("✅ Spectrogram cache ready!")


# ============ CELL 10: Phase 8, 9, 10 — Model Building & Training ============
# ⚠️ This is the main training cell!

import torch
from src.phase08_model import build_model
from src.phase09_training import Trainer
from src.dataset import create_dataloaders

# ============================================================
# 🔧 TRAINING SETTINGS — Adjust these as needed!
# ============================================================
TRAIN_EPOCHS = 30        # Full training run
TRAIN_BATCH_SIZE = config.BATCH_SIZE  # Uses default from config (64)
USE_SUBSET = None        # Set to 0.1 for 10% subset (quick test)
# ============================================================

if USE_SUBSET:
    train_df_use = train_df.sample(frac=USE_SUBSET, random_state=42).reset_index(drop=True)
    val_df_use = val_df.sample(frac=USE_SUBSET, random_state=42).reset_index(drop=True)
    print(f"🔄 Using {USE_SUBSET*100:.0f}% subset: Train={len(train_df_use)}, Val={len(val_df_use)}")
else:
    train_df_use = train_df
    val_df_use = val_df

print("📦 Creating dataloaders...")
train_loader, val_loader, test_loader = create_dataloaders(
    train_df_use, val_df_use, test_df, label_processor,
    batch_size=TRAIN_BATCH_SIZE,
    cache_dir=CACHE_DIR,
)
print(f"  Train batches: {len(train_loader)}")
print(f"  Val batches: {len(val_loader)}")

print("🏗️ Phase 8: Building EfficientNet-B3 model...")
model = build_model(num_classes=label_processor.num_classes)
print(f"  Device: {config.DEVICE}")

print("\n🚀 Phase 9 & 10: Starting OPTIMIZED training & regularization loop...")
trainer = Trainer(model, train_loader, val_loader)
history = trainer.train(num_epochs=TRAIN_EPOCHS)

print(f"\n✅ Phases 8-10 Complete!")
print(f"  Best Val F1: {max(history['val_f1']):.4f}")


# ============ CELL 11 (OPTIONAL): Phase 11 — Hyperparameter Tuning ============
# ⚠️ This is very time-consuming! Only run if you have extra time.

# from src.phase11_tuning import run_tuning
# best_params = run_tuning(n_trials=15)
# print(f"Best params: {best_params}")


# ============ CELL 12: Phase 12 — Model Evaluation ============

from src.phase12_evaluation import run_evaluation

# Load best model
model.load_state_dict(torch.load(config.BEST_MODEL_PATH, map_location=config.DEVICE))
run_evaluation(model=model, test_loader=test_loader, label_processor=label_processor)

print("\n✅ Phase 12 Evaluation complete!")

# Display evaluation plots
eval_plots = glob.glob(os.path.join(WORK_DIR, "outputs", "evaluation", "*.png"))
for plot_path in eval_plots:
    print(f"\n📊 {os.path.basename(plot_path)}")
    display(IPImage(filename=plot_path))


# ============ CELL 13: Phase 13 — Save Model Artifacts to Google Drive ============

import shutil

drive_models_dir = os.path.join(PROJECT_DIR, "outputs", "models")
os.makedirs(drive_models_dir, exist_ok=True)

local_models_dir = os.path.join(WORK_DIR, "outputs", "models")
for fname in os.listdir(local_models_dir):
    src = os.path.join(local_models_dir, fname)
    dst = os.path.join(drive_models_dir, fname)
    shutil.copy2(src, dst)
    size_mb = os.path.getsize(src) / (1024 * 1024)
    print(f"  📥 Saved: {fname} ({size_mb:.1f} MB)")

drive_eval_dir = os.path.join(PROJECT_DIR, "outputs", "evaluation")
os.makedirs(drive_eval_dir, exist_ok=True)

local_eval_dir = os.path.join(WORK_DIR, "outputs", "evaluation")
if os.path.exists(local_eval_dir):
    for fname in os.listdir(local_eval_dir):
        shutil.copy2(
            os.path.join(local_eval_dir, fname),
            os.path.join(drive_eval_dir, fname)
        )

print("\n✅ Phase 13: All outputs saved to Google Drive!")
print(f"  Models: {drive_models_dir}")
print(f"  Evaluation: {drive_eval_dir}")


# ============ CELL 14: Phase 14 — Single File Inference Test ============

from src.phase14_inference import InferencePipeline

pipeline = InferencePipeline()

test_file = test_df.iloc[0]["filename"]
test_path = os.path.join(config.TRAIN_AUDIO_DIR, test_file)

print(f"🎵 Phase 14 Testing Inference on: {test_file}")
result = pipeline.predict(test_path)

print(f"\n{'='*50}")
print(f"  PREDICTION RESULT")
print(f"{'='*50}")
print(f"  Common Name:         {result.get('common_name', 'N/A')}")
print(f"  Scientific Name:     {result.get('scientific_name', 'N/A')}")
print(f"  Animal Class:        {result.get('animal_class', 'N/A')}")
print(f"  Confidence:          {result['confidence'] * 100:.1f}%")
print(f"  Habitat:             {result.get('habitat', 'N/A')}")
print(f"  Diet:                {result.get('diet', 'N/A')}")
print(f"  Conservation Status: {result.get('conservation_status', 'N/A')}")
print(f"\n  Top 5 Predictions:")
for i, pred in enumerate(result["top_k_predictions"]):
    print(f"    {i+1}. {pred['label']} ({pred['confidence']*100:.1f}%)")

if result.get("spectrogram") is not None:
    fig, ax = plt.subplots(figsize=(12, 4))
    ax.imshow(result["spectrogram"], aspect="auto", origin="lower", cmap="magma")
    ax.set_title(f"Spectrogram: {result.get('common_name', 'Unknown')}", fontsize=14)
    ax.set_xlabel("Time")
    ax.set_ylabel("Mel Frequency")
    plt.tight_layout()
    plt.show()
