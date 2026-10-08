"""
Pre-compute Spectrogram Cache
===============================
Processes all audio files once and saves Log-Mel Spectrograms as .npy files.
This eliminates the CPU audio processing bottleneck during training.

Usage:
    from src.precompute_cache import precompute_spectrograms
    precompute_spectrograms(df, cache_dir="/content/wildlife/spec_cache")
"""

import os
import sys

import numpy as np
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.phase03_preprocessing import AudioPreprocessor
from src.phase05_features import MelSpectrogramExtractor


def precompute_spectrograms(df, cache_dir=None, audio_dir=None):
    """
    Pre-compute and cache Log-Mel Spectrograms for all audio files.

    For each audio file in the DataFrame, runs the full preprocessing
    pipeline (load → mono → normalize → silence removal → fix length)
    and feature extraction (Log-Mel Spectrogram), then saves the result
    as a .npy file for ultra-fast loading during training.

    Args:
        df: DataFrame with 'filename' column pointing to audio files.
        cache_dir: Directory to save cached .npy spectrograms.
        audio_dir: Directory containing raw audio files.

    Returns:
        str: Path to the cache directory.
    """
    cache_dir = cache_dir or os.path.join(config.OUTPUTS_DIR, "spec_cache")
    audio_dir = audio_dir or config.TRAIN_AUDIO_DIR

    os.makedirs(cache_dir, exist_ok=True)

    # Use val/test mode preprocessor (center crop, no random crop)
    # so cached spectrograms are deterministic base versions.
    # Augmentation is applied at the tensor level during training.
    preprocessor = AudioPreprocessor(mode="val")
    extractor = MelSpectrogramExtractor()

    # Check how many are already cached
    filenames = df["filename"].unique()
    uncached = []
    for fname in filenames:
        cache_path = os.path.join(cache_dir, fname.replace("/", "_").replace("\\", "_") + ".npy")
        if not os.path.exists(cache_path):
            uncached.append(fname)

    if len(uncached) == 0:
        print(f"✅ All {len(filenames)} spectrograms already cached in: {cache_dir}")
        return cache_dir

    print(f"📦 Pre-computing spectrograms: {len(uncached)} uncached / {len(filenames)} total")
    print(f"   Cache directory: {cache_dir}")

    failed = 0
    for fname in tqdm(uncached, desc="Caching spectrograms"):
        filepath = os.path.join(audio_dir, fname)
        cache_path = os.path.join(cache_dir, fname.replace("/", "_").replace("\\", "_") + ".npy")

        # Create subdirectory if needed
        os.makedirs(os.path.dirname(cache_path) if os.path.dirname(cache_path) else cache_dir, exist_ok=True)

        try:
            # Full preprocessing pipeline
            waveform = preprocessor.process(filepath)

            # Extract Log-Mel Spectrogram
            spec = extractor.extract(waveform)

            # Save as compressed .npy
            np.save(cache_path, spec.astype(np.float16))

        except Exception as e:
            failed += 1
            if failed <= 5:
                print(f"  ⚠️ Failed: {fname} — {e}")

    cached_count = len(filenames) - failed
    print(f"✅ Cached {cached_count}/{len(filenames)} spectrograms ({failed} failed)")
    print(f"   Cache size: {_get_dir_size_mb(cache_dir):.1f} MB")

    return cache_dir


def _get_dir_size_mb(path):
    """Get total size of a directory in MB."""
    total = 0
    for dirpath, _, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total += os.path.getsize(fp)
    return total / (1024 * 1024)
