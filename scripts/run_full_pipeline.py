"""
Run Full Pipeline Script
========================
Runs the entire pipeline from EDA to model evaluation.

Usage:
    python scripts/run_full_pipeline.py
    python scripts/run_full_pipeline.py --skip-eda
    python scripts/run_full_pipeline.py --subset 0.1 --epochs 10
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from src.utils import setup_logging, set_seed, print_separator, format_duration


def main():
    parser = argparse.ArgumentParser(description="Run the complete pipeline")
    parser.add_argument("--skip-eda", action="store_true", help="Skip EDA phase")
    parser.add_argument("--skip-tuning", action="store_true", help="Skip Optuna tuning")
    parser.add_argument("--subset", type=float, default=None, help="Use data subset")
    parser.add_argument("--epochs", type=int, default=config.NUM_EPOCHS, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=config.BATCH_SIZE, help="Batch size")
    args = parser.parse_args()

    config.create_output_dirs()
    set_seed(config.RANDOM_SEED)
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "full_pipeline.log")
    )

    total_start = time.time()
    print_separator("ANIMAL SOUND IDENTIFICATION - FULL PIPELINE")
    config.get_device_info()

    # ==========================================
    # Phase 1: EDA
    # ==========================================
    if not args.skip_eda:
        logger.info("\n" + "=" * 50)
        logger.info("PHASE 1: Exploratory Data Analysis")
        from src.phase01_eda import run_eda
        run_eda()

    # ==========================================
    # Phase 2: Data Cleaning
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 2: Data Cleaning")
    from src.phase02_cleaning import run_cleaning
    cleaned_df = run_cleaning()

    # ==========================================
    # Phase 6: Label Encoding
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 6: Label Encoding")
    from src.phase06_labels import LabelProcessor
    import pandas as pd

    if args.subset:
        cleaned_df = cleaned_df.sample(
            frac=args.subset, random_state=config.RANDOM_SEED
        ).reset_index(drop=True)
        logger.info(f"Using {args.subset*100:.0f}% subset: {len(cleaned_df)} records")

    label_processor = LabelProcessor()
    label_processor.fit(cleaned_df["primary_label"].values)
    label_processor.save()
    logger.info(f"Encoded {label_processor.num_classes} classes")

    # ==========================================
    # Phase 7: Dataset Splitting
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 7: Dataset Splitting")
    from src.phase07_splitting import split_dataset, save_splits
    train_df, val_df, test_df = split_dataset(cleaned_df, logger=logger)
    save_splits(train_df, val_df, test_df, logger=logger)

    # ==========================================
    # Phase 15: Animal Database
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 15: Animal Database")
    from src.phase15_database import AnimalDatabase
    db = AnimalDatabase()
    db.build_from_taxonomy(logger=logger)
    db.close()

    # ==========================================
    # Phase 8-10: Model Training
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASES 8-10: Model Building & Training")
    from src.phase08_model import build_model
    from src.phase09_training import Trainer
    from src.dataset import create_dataloaders

    train_loader, val_loader, test_loader = create_dataloaders(
        train_df, val_df, test_df, label_processor,
        batch_size=args.batch_size,
    )

    model = build_model(num_classes=label_processor.num_classes)
    trainer = Trainer(model, train_loader, val_loader, logger=logger)
    history = trainer.train(num_epochs=args.epochs)

    # ==========================================
    # Phase 13: Save Model
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 13: Saving Model")
    from src.phase13_saving import save_model_artifacts
    save_model_artifacts(model, label_processor, logger=logger)

    # ==========================================
    # Phase 12: Evaluation
    # ==========================================
    logger.info("\n" + "=" * 50)
    logger.info("PHASE 12: Model Evaluation")
    from src.phase12_evaluation import run_evaluation
    # Load best model for evaluation
    import torch
    model.load_state_dict(torch.load(config.BEST_MODEL_PATH, map_location=config.DEVICE))
    run_evaluation(model=model, test_loader=test_loader, label_processor=label_processor)

    # ==========================================
    # Phase 11: Hyperparameter Tuning (optional)
    # ==========================================
    if not args.skip_tuning:
        logger.info("\n" + "=" * 50)
        logger.info("PHASE 11: Hyperparameter Tuning")
        from src.phase11_tuning import run_tuning
        run_tuning(train_df=train_df, val_df=val_df, label_processor=label_processor)

    # Summary
    total_time = time.time() - total_start
    print_separator("PIPELINE COMPLETE")
    logger.info(f"Total pipeline time: {format_duration(total_time)}")
    logger.info(f"Model saved to: {config.BEST_MODEL_PATH}")
    logger.info(f"Evaluation outputs: {config.EVALUATION_OUTPUT_DIR}")
    logger.info("")
    logger.info("Next steps:")
    logger.info("  1. Start backend: cd backend && uvicorn main:app --reload")
    logger.info("  2. Start frontend: cd frontend && streamlit run app.py")
    logger.info("  3. Single inference: python scripts/run_inference.py --audio <file>")


if __name__ == "__main__":
    main()
