"""
Run Training Script
===================
Standalone script to run the complete training pipeline.

Usage:
    python scripts/run_training.py
    python scripts/run_training.py --epochs 50
    python scripts/run_training.py --subset 0.1
    python scripts/run_training.py --batch-size 16
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from src.utils import setup_logging, set_seed, print_separator


def main():
    parser = argparse.ArgumentParser(description="Train BirdCLEF model")
    parser.add_argument("--epochs", type=int, default=config.NUM_EPOCHS,
                        help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=config.BATCH_SIZE,
                        help="Batch size")
    parser.add_argument("--subset", type=float, default=None,
                        help="Use a fraction of the data (e.g., 0.1 for 10%%)")
    parser.add_argument("--freeze-epochs", type=int, default=config.FREEZE_EPOCHS,
                        help="Epochs for head-only training")
    parser.add_argument("--lr", type=float, default=config.LEARNING_RATE_HEAD,
                        help="Learning rate for classifier head")
    args = parser.parse_args()

    # Setup
    config.create_output_dirs()
    set_seed(config.RANDOM_SEED)
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "training.log")
    )
    
    print_separator("ANIMAL SOUND IDENTIFICATION - TRAINING")
    config.get_device_info()

    # Import after path setup
    import pandas as pd
    from src.phase06_labels import LabelProcessor
    from src.phase07_splitting import split_dataset, save_splits, load_splits
    from src.phase08_model import build_model
    from src.phase09_training import Trainer
    from src.dataset import create_dataloaders

    # Load cleaned data
    cleaned_path = os.path.join(config.CLEANED_OUTPUT_DIR, "train_cleaned.csv")
    if os.path.exists(cleaned_path):
        logger.info(f"Loading cleaned data from: {cleaned_path}")
        df = pd.read_csv(cleaned_path)
    else:
        logger.info("No cleaned data found. Loading raw train.csv...")
        logger.info("TIP: Run 'python scripts/run_cleaning.py' first for best results.")
        df = pd.read_csv(config.TRAIN_CSV)

    # Subset mode
    if args.subset:
        logger.info(f"Using {args.subset * 100:.0f}% subset of data")
        df = df.sample(frac=args.subset, random_state=config.RANDOM_SEED).reset_index(drop=True)
        logger.info(f"Subset size: {len(df)} records, {df['primary_label'].nunique()} species")

    # Check for existing splits
    splits_exist = all(
        os.path.exists(os.path.join(config.CLEANED_OUTPUT_DIR, f))
        for f in ["train_split.csv", "val_split.csv", "test_split.csv"]
    )

    if splits_exist and not args.subset:
        logger.info("Loading existing splits...")
        train_df, val_df, test_df = load_splits()
    else:
        logger.info("Performing stratified split...")
        train_df, val_df, test_df = split_dataset(df, logger=logger)
        save_splits(train_df, val_df, test_df, logger=logger)

    # Label encoding
    logger.info("Encoding labels...")
    label_processor = LabelProcessor()
    label_processor.fit(df["primary_label"].values)
    label_processor.save()
    logger.info(f"Number of classes: {label_processor.num_classes}")

    # Create dataloaders
    logger.info("Creating dataloaders...")
    train_loader, val_loader, test_loader = create_dataloaders(
        train_df, val_df, test_df, label_processor,
        batch_size=args.batch_size,
    )
    logger.info(f"Train batches: {len(train_loader)}")
    logger.info(f"Val batches: {len(val_loader)}")

    # Build model
    logger.info("Building model...")
    model = build_model(num_classes=label_processor.num_classes)

    # Train
    trainer = Trainer(model, train_loader, val_loader, logger=logger)
    history = trainer.train(
        num_epochs=args.epochs,
        freeze_epochs=args.freeze_epochs,
    )

    logger.info("Training complete! Best model saved to: " + config.BEST_MODEL_PATH)
    logger.info("Run 'python scripts/run_evaluation.py' to evaluate the model.")


if __name__ == "__main__":
    main()
