"""
PyTorch Dataset
===============
Custom Dataset classes for efficient data loading:
- BirdCLEFDataset: Original on-the-fly audio processing pipeline.
- CachedBirdCLEFDataset: Ultra-fast cached spectrogram loading (~100× faster).

Usage:
    from src.dataset import create_dataloaders
    train_loader, val_loader, test_loader = create_dataloaders(
        train_df, val_df, test_df, label_processor
    )
"""

import os
import sys

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.phase03_preprocessing import AudioPreprocessor
from src.phase04_augmentation import AudioAugmentor, SpecAugment
from src.phase05_features import MelSpectrogramExtractor


class CachedBirdCLEFDataset(Dataset):
    """
    Ultra-fast PyTorch Dataset that loads pre-computed spectrograms from .npy cache.

    Instead of decoding audio and computing FFTs on every access (~42ms/sample),
    this loads a tiny .npy file in ~0.3ms — a ~100× speedup per sample.

    Only SpecAugment (fast tensor masking) is applied during training.

    Args:
        df: DataFrame with 'filename' and 'primary_label' columns.
        label_processor: Fitted LabelProcessor instance.
        cache_dir: Directory containing cached .npy spectrograms.
        mode: One of 'train', 'val', 'test'. Controls augmentation.
        spec_augment: Whether to apply SpecAugment (only for train mode).
    """

    def __init__(self, df, label_processor, cache_dir=None, mode="train",
                 spec_augment=True):
        self.df = df.reset_index(drop=True)
        self.label_processor = label_processor
        self.cache_dir = cache_dir or os.path.join(config.OUTPUTS_DIR, "spec_cache")
        self.mode = mode

        # Encode labels
        self.labels = label_processor.encode(self.df["primary_label"].values)

        # SpecAugment (fast tensor-level augmentation, only for training)
        self.spec_augment_enabled = spec_augment and mode == "train"
        if self.spec_augment_enabled:
            self.spec_augmentor = SpecAugment()

        # Pre-build cache path list for fast lookup
        self.cache_paths = []
        for _, row in self.df.iterrows():
            fname = row["filename"]
            cache_name = fname.replace("/", "_").replace("\\", "_") + ".npy"
            self.cache_paths.append(os.path.join(self.cache_dir, cache_name))

        # Fallback extractor for missing cache files
        self._fallback_extractor = None

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        """
        Load a pre-computed spectrogram and apply fast SpecAugment.

        Pipeline:
            1. Load cached .npy spectrogram (~0.3ms)
            2. Apply SpecAugment masking (train only, ~0.1ms)
            3. Convert to 3-channel tensor

        Returns:
            tuple: (spectrogram_tensor [3, n_mels, time_steps], label_index)
        """
        label = self.labels[idx]
        cache_path = self.cache_paths[idx]

        try:
            # Step 1: Load cached spectrogram (float16 → float32)
            spec = np.load(cache_path).astype(np.float32)

            # Step 2: SpecAugment (train only — fast tensor masking)
            if self.spec_augment_enabled:
                spec_t = torch.from_numpy(spec).float()
                spec_t = self.spec_augmentor(spec_t)
                if isinstance(spec_t, torch.Tensor):
                    spec = spec_t.numpy()

            # Step 3: Convert to 3-channel tensor (for EfficientNet)
            spec_tensor = torch.from_numpy(spec).float().unsqueeze(0)
            spec_tensor = spec_tensor.repeat(3, 1, 1)

        except Exception:
            # Fallback: try on-the-fly processing or return zeros
            try:
                spec_tensor = self._fallback_process(idx)
            except Exception:
                n_mels = config.N_MELS
                time_steps = config.AUDIO_LENGTH // config.HOP_LENGTH + 1
                spec_tensor = torch.zeros(3, n_mels, time_steps)

        return spec_tensor, label

    def _fallback_process(self, idx):
        """On-the-fly fallback for missing cache files."""
        if self._fallback_extractor is None:
            self._fallback_extractor = MelSpectrogramExtractor()
            self._fallback_preprocessor = AudioPreprocessor(mode=self.mode)

        row = self.df.iloc[idx]
        filepath = os.path.join(config.TRAIN_AUDIO_DIR, row["filename"])
        waveform = self._fallback_preprocessor.process(filepath)
        spec = self._fallback_extractor.extract(waveform)
        spec_tensor = torch.from_numpy(spec).float().unsqueeze(0)
        return spec_tensor.repeat(3, 1, 1)


class BirdCLEFDataset(Dataset):
    """
    Original PyTorch Dataset for BirdCLEF 2026 audio classification.

    Combines audio preprocessing, augmentation (train only), and
    Log-Mel Spectrogram extraction into a single pipeline.
    Use CachedBirdCLEFDataset for much faster training.

    Args:
        df: DataFrame with 'filename' and 'primary_label' columns.
        label_processor: Fitted LabelProcessor instance.
        audio_dir: Directory containing audio files.
        mode: One of 'train', 'val', 'test'. Controls augmentation and cropping.
        augment: Whether to apply augmentation (only for train mode).
        spec_augment: Whether to apply SpecAugment (only for train mode).
    """

    def __init__(self, df, label_processor, audio_dir=None, mode="train",
                 augment=True, spec_augment=True):
        self.df = df.reset_index(drop=True)
        self.label_processor = label_processor
        self.audio_dir = audio_dir or config.TRAIN_AUDIO_DIR
        self.mode = mode

        # Encode labels
        self.labels = label_processor.encode(self.df["primary_label"].values)

        # Initialize pipeline components
        self.preprocessor = AudioPreprocessor(mode=mode)
        self.feature_extractor = MelSpectrogramExtractor()

        # Augmentation (only for training)
        self.augment = augment and mode == "train"
        self.spec_augment_enabled = spec_augment and mode == "train"

        if self.augment:
            self.augmentor = AudioAugmentor()
        if self.spec_augment_enabled:
            self.spec_augmentor = SpecAugment()

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        """
        Get a single sample: spectrogram tensor and label.

        Pipeline:
            1. Load and preprocess audio
            2. Apply waveform augmentation (train only)
            3. Extract Log-Mel Spectrogram
            4. Apply SpecAugment (train only)
            5. Convert to 3-channel tensor
        """
        row = self.df.iloc[idx]
        filepath = os.path.join(self.audio_dir, row["filename"])
        label = self.labels[idx]

        try:
            waveform = self.preprocessor.process(filepath)

            if self.augment:
                waveform = self.augmentor.augment(waveform)

            spec = self.feature_extractor.extract(waveform)

            if self.spec_augment_enabled:
                spec = self.spec_augmentor(torch.from_numpy(spec).float())
                if isinstance(spec, torch.Tensor):
                    spec = spec.numpy()

            spec_tensor = torch.from_numpy(spec).float().unsqueeze(0)
            spec_tensor = spec_tensor.repeat(3, 1, 1)

        except Exception as e:
            spec_shape = self.feature_extractor.get_spectrogram_shape()
            spec_tensor = torch.zeros(3, spec_shape[0], spec_shape[1])

        return spec_tensor, label


def create_dataloaders(train_df, val_df, test_df, label_processor,
                       batch_size=None, num_workers=None, cache_dir=None):
    """
    Create DataLoaders for train, validation, and test sets.
    Automatically uses CachedBirdCLEFDataset if a spectrogram cache exists.

    Args:
        train_df: Training dataframe.
        val_df: Validation dataframe.
        test_df: Test dataframe.
        label_processor: Fitted LabelProcessor.
        batch_size: Batch size (default from config).
        num_workers: Number of DataLoader workers (default from config).
        cache_dir: Path to spectrogram cache directory.

    Returns:
        tuple: (train_loader, val_loader, test_loader)
    """
    batch_size = batch_size or config.BATCH_SIZE
    num_workers = num_workers or config.NUM_WORKERS

    # Auto-detect spectrogram cache
    cache_dir = cache_dir or os.path.join(config.OUTPUTS_DIR, "spec_cache")
    use_cache = os.path.isdir(cache_dir) and len(os.listdir(cache_dir)) > 0

    if use_cache:
        print(f"⚡ Using cached spectrograms from: {cache_dir}")
        train_dataset = CachedBirdCLEFDataset(train_df, label_processor, cache_dir, mode="train")
        val_dataset = CachedBirdCLEFDataset(val_df, label_processor, cache_dir, mode="val")
        test_dataset = CachedBirdCLEFDataset(test_df, label_processor, cache_dir, mode="test")
    else:
        print("🐌 No cache found — using on-the-fly audio processing (slow)")
        print("   TIP: Run precompute_spectrograms() first for 10× faster training!")
        train_dataset = BirdCLEFDataset(train_df, label_processor, mode="train")
        val_dataset = BirdCLEFDataset(val_df, label_processor, mode="val")
        test_dataset = BirdCLEFDataset(test_df, label_processor, mode="test")

    persistent_workers = getattr(config, "PERSISTENT_WORKERS", True) if num_workers > 0 else False
    prefetch_factor = getattr(config, "PREFETCH_FACTOR", 2) if num_workers > 0 else None

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=config.PIN_MEMORY,
        persistent_workers=persistent_workers,
        prefetch_factor=prefetch_factor,
        drop_last=True,
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=config.PIN_MEMORY,
        persistent_workers=persistent_workers,
        prefetch_factor=prefetch_factor,
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=config.PIN_MEMORY,
        persistent_workers=persistent_workers,
        prefetch_factor=prefetch_factor,
    )

    return train_loader, val_loader, test_loader
