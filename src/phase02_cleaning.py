"""
Phase 2: Data Cleaning
======================
Cleans the BirdCLEF 2026 dataset by:
- Removing corrupted audio files
- Removing entries with missing audio files
- Removing duplicate entries
- Filtering by recording quality (rating >= 3)
- Keeping only primary_label for classification

Usage:
    python scripts/run_cleaning.py

    Or programmatically:
        from src.phase02_cleaning import run_cleaning
        cleaned_df = run_cleaning()
"""

import os
import sys

import librosa
import pandas as pd
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator


def remove_missing_files(train_df, logger):
    """
    Remove entries where the audio file does not exist on disk.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    
    Returns:
        pd.DataFrame: Filtered dataframe.
    """
    logger.info("Checking for missing audio files...")
    initial_count = len(train_df)
    
    exists_mask = []
    for _, row in tqdm(train_df.iterrows(), total=len(train_df), desc="Checking files"):
        filepath = os.path.join(config.TRAIN_AUDIO_DIR, row["filename"])
        exists_mask.append(os.path.exists(filepath))

    train_df = train_df[exists_mask].reset_index(drop=True)
    removed = initial_count - len(train_df)
    logger.info(f"  Removed {removed} entries with missing audio files.")
    logger.info(f"  Remaining: {len(train_df)}")
    return train_df


def remove_corrupted_files(train_df, logger):
    """
    Remove entries where the audio file cannot be loaded by librosa.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    
    Returns:
        pd.DataFrame: Filtered dataframe.
    """
    logger.info("Checking for corrupted audio files...")
    initial_count = len(train_df)
    
    valid_mask = []
    corrupted_files = []
    
    for _, row in tqdm(train_df.iterrows(), total=len(train_df), desc="Validating audio"):
        filepath = os.path.join(config.TRAIN_AUDIO_DIR, row["filename"])
        try:
            # Try to load just a tiny portion to check file integrity
            y, sr = librosa.load(filepath, sr=None, duration=0.5)
            if y is not None and len(y) > 0:
                valid_mask.append(True)
            else:
                valid_mask.append(False)
                corrupted_files.append(row["filename"])
        except Exception as e:
            valid_mask.append(False)
            corrupted_files.append(row["filename"])

    train_df = train_df[valid_mask].reset_index(drop=True)
    removed = initial_count - len(train_df)
    logger.info(f"  Removed {removed} corrupted audio files.")
    
    if corrupted_files:
        logger.info(f"  Sample corrupted files: {corrupted_files[:10]}")

    logger.info(f"  Remaining: {len(train_df)}")
    return train_df


def remove_duplicates(train_df, logger):
    """
    Remove duplicate entries from the dataset.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    
    Returns:
        pd.DataFrame: Deduplicated dataframe.
    """
    logger.info("Removing duplicate entries...")
    initial_count = len(train_df)

    # Remove full row duplicates
    train_df = train_df.drop_duplicates().reset_index(drop=True)
    full_dupes = initial_count - len(train_df)
    logger.info(f"  Removed {full_dupes} full-row duplicates.")

    # Remove filename duplicates (keep first occurrence)
    before = len(train_df)
    train_df = train_df.drop_duplicates(subset=["filename"], keep="first").reset_index(drop=True)
    fname_dupes = before - len(train_df)
    logger.info(f"  Removed {fname_dupes} filename duplicates.")

    logger.info(f"  Remaining: {len(train_df)}")
    return train_df


def filter_by_rating(train_df, logger, min_rating=None):
    """
    Keep only recordings with rating >= min_rating.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
        min_rating: Minimum rating threshold (default from config).
    
    Returns:
        pd.DataFrame: Filtered dataframe.
    """
    if min_rating is None:
        min_rating = config.MIN_RATING

    if "rating" not in train_df.columns:
        logger.warning("'rating' column not found. Skipping rating filter.")
        return train_df

    logger.info(f"Filtering by rating >= {min_rating}...")
    initial_count = len(train_df)
    
    train_df = train_df[train_df["rating"] >= min_rating].reset_index(drop=True)
    removed = initial_count - len(train_df)
    logger.info(f"  Removed {removed} low-quality recordings.")
    logger.info(f"  Remaining: {len(train_df)}")
    return train_df


def clean_columns(train_df, logger):
    """
    Clean columns: drop secondary_labels, keep primary_label.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    
    Returns:
        pd.DataFrame: Cleaned dataframe.
    """
    logger.info("Cleaning columns...")

    # Drop secondary_labels if present
    if "secondary_labels" in train_df.columns:
        train_df = train_df.drop(columns=["secondary_labels"])
        logger.info("  Dropped 'secondary_labels' column.")

    # Ensure primary_label column exists and has no NaN
    if train_df["primary_label"].isnull().any():
        before = len(train_df)
        train_df = train_df.dropna(subset=["primary_label"]).reset_index(drop=True)
        logger.info(f"  Removed {before - len(train_df)} rows with missing primary_label.")

    logger.info(f"  Final columns: {list(train_df.columns)}")
    return train_df


def generate_cleaning_report(original_count, cleaned_df, stats, logger):
    """
    Generate a cleaning report summarizing what was removed.
    
    Args:
        original_count: Original number of records.
        cleaned_df: Cleaned dataframe.
        stats: Dictionary of removal statistics.
        logger: Logger instance.
    """
    report_path = os.path.join(config.CLEANED_OUTPUT_DIR, "cleaning_report.txt")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write("  DATA CLEANING REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Original records: {original_count}\n")
        f.write(f"Final records: {len(cleaned_df)}\n")
        f.write(f"Total removed: {original_count - len(cleaned_df)}\n")
        f.write(f"Retention rate: {len(cleaned_df) / original_count * 100:.1f}%\n\n")
        
        f.write("REMOVAL BREAKDOWN\n")
        f.write("-" * 40 + "\n")
        for step, count in stats.items():
            f.write(f"{step}: {count}\n")

        f.write(f"\nFinal species count: {cleaned_df['primary_label'].nunique()}\n")
        f.write(f"Average recordings per species: {len(cleaned_df) / cleaned_df['primary_label'].nunique():.1f}\n")

    logger.info(f"Saved cleaning report to: {report_path}")


def run_cleaning():
    """
    Run the complete data cleaning pipeline.
    
    Returns:
        pd.DataFrame: Cleaned training dataframe.
    """
    config.create_output_dirs()
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "phase02_cleaning.log")
    )

    print_separator("PHASE 2: DATA CLEANING")
    logger.info("Starting data cleaning pipeline...")

    # Load dataset
    train_df = pd.read_csv(config.TRAIN_CSV)
    original_count = len(train_df)
    logger.info(f"Loaded {original_count} records from train.csv")

    stats = {}

    # Step 1: Remove missing files
    before = len(train_df)
    train_df = remove_missing_files(train_df, logger)
    stats["Missing files removed"] = before - len(train_df)

    # Step 2: Remove corrupted files
    before = len(train_df)
    train_df = remove_corrupted_files(train_df, logger)
    stats["Corrupted files removed"] = before - len(train_df)

    # Step 3: Remove duplicates
    before = len(train_df)
    train_df = remove_duplicates(train_df, logger)
    stats["Duplicates removed"] = before - len(train_df)

    # Step 4: Filter by rating
    before = len(train_df)
    train_df = filter_by_rating(train_df, logger)
    stats["Low-rating removed"] = before - len(train_df)

    # Step 5: Clean columns
    before = len(train_df)
    train_df = clean_columns(train_df, logger)
    stats["Missing labels removed"] = before - len(train_df)

    # Save cleaned dataset
    cleaned_path = os.path.join(config.CLEANED_OUTPUT_DIR, "train_cleaned.csv")
    train_df.to_csv(cleaned_path, index=False)
    logger.info(f"Saved cleaned dataset to: {cleaned_path}")
    logger.info(f"Final dataset: {len(train_df)} records, {train_df['primary_label'].nunique()} species")

    # Generate report
    generate_cleaning_report(original_count, train_df, stats, logger)

    print_separator("CLEANING COMPLETE")
    return train_df


if __name__ == "__main__":
    run_cleaning()
