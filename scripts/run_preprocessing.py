"""
Run Preprocessing Script
========================
Standalone script to run Phase 2 (Cleaning) + Phase 7 (Splitting) + 
Phase 6 (Label Encoding) + Phase 15 (Database).

Prepares all data for training.

Usage:
    python scripts/run_preprocessing.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from src.utils import setup_logging, set_seed, print_separator


def main():
    config.create_output_dirs()
    set_seed(config.RANDOM_SEED)
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "preprocessing.log")
    )

    print_separator("DATA PREPROCESSING PIPELINE")

    # Step 1: Clean data
    logger.info("Step 1: Data Cleaning...")
    from src.phase02_cleaning import run_cleaning
    cleaned_df = run_cleaning()

    # Step 2: Split data
    logger.info("Step 2: Dataset Splitting...")
    from src.phase07_splitting import split_dataset, save_splits
    train_df, val_df, test_df = split_dataset(cleaned_df, logger=logger)
    save_splits(train_df, val_df, test_df, logger=logger)

    # Step 3: Label encoding
    logger.info("Step 3: Label Encoding...")
    from src.phase06_labels import LabelProcessor
    label_processor = LabelProcessor()
    label_processor.fit(cleaned_df["primary_label"].values)
    label_processor.save()
    logger.info(f"Encoded {label_processor.num_classes} classes")

    # Step 4: Build animal database
    logger.info("Step 4: Building Animal Database...")
    from src.phase15_database import AnimalDatabase
    db = AnimalDatabase()
    db.build_from_taxonomy(logger=logger)
    db.close()

    print_separator("PREPROCESSING COMPLETE")
    logger.info("Ready for training! Run: python scripts/run_training.py")


if __name__ == "__main__":
    main()
