"""
Phase 7: Dataset Splitting
============================
Stratified splitting of the cleaned dataset into train/val/test sets.

Ratio: 70% Training, 15% Validation, 15% Testing

Usage:
    from src.phase07_splitting import split_dataset
    train_df, val_df, test_df = split_dataset(cleaned_df)
"""

import os
import sys

import pandas as pd
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator


def split_dataset(df, train_ratio=None, val_ratio=None, test_ratio=None, 
                  random_seed=None, logger=None):
    """
    Perform robust train/val/test split.
    
    Ensures species with few samples (< 3) are handled gracefully without raising
    scikit-learn StratifiedShuffleSplit errors.
    
    Args:
        df: Cleaned dataframe with 'primary_label' column.
        train_ratio: Training set proportion (default: 0.70).
        val_ratio: Validation set proportion (default: 0.15).
        test_ratio: Test set proportion (default: 0.15).
        random_seed: Random seed for reproducibility.
        logger: Optional logger instance.
    
    Returns:
        tuple: (train_df, val_df, test_df)
    """
    train_ratio = train_ratio or config.TRAIN_RATIO
    val_ratio = val_ratio or config.VAL_RATIO
    test_ratio = test_ratio or config.TEST_RATIO
    random_seed = random_seed or config.RANDOM_SEED

    if logger is None:
        logger = setup_logging()

    logger.info(f"Splitting dataset: train={train_ratio}, val={val_ratio}, test={test_ratio}")
    logger.info(f"Total samples: {len(df)}, Total species: {df['primary_label'].nunique()}")

    # Count samples per species
    label_counts = df["primary_label"].value_counts()
    rare_species = label_counts[label_counts < 3].index.tolist()
    
    if rare_species:
        logger.info(f"Species with < 3 samples (handled separately): {len(rare_species)}")
        rare_df = df[df["primary_label"].isin(rare_species)].copy()
        df_stratifiable = df[~df["primary_label"].isin(rare_species)].copy()
        
        # Distribute rare species manually across train/val/test
        rare_train, rare_val, rare_test = [], [], []
        for species, group in rare_df.groupby("primary_label"):
            records = group.to_dict('records')
            if len(records) == 1:
                rare_train.extend(records)
            elif len(records) == 2:
                rare_train.append(records[0])
                rare_val.append(records[1])
        
        rare_train_df = pd.DataFrame(rare_train)
        rare_val_df = pd.DataFrame(rare_val)
        rare_test_df = pd.DataFrame(rare_test)
    else:
        rare_train_df = pd.DataFrame()
        rare_val_df = pd.DataFrame()
        rare_test_df = pd.DataFrame()
        df_stratifiable = df.copy()

    # Stratified split on species with >= 3 samples
    val_test_ratio = val_ratio + test_ratio
    train_df, temp_df = train_test_split(
        df_stratifiable,
        test_size=val_test_ratio,
        stratify=df_stratifiable["primary_label"],
        random_state=random_seed,
    )

    # Second split: val vs test
    test_fraction = test_ratio / val_test_ratio
    temp_counts = temp_df["primary_label"].value_counts()
    temp_rare = temp_counts[temp_counts < 2].index.tolist()
    
    if temp_rare:
        val_df, test_df = train_test_split(
            temp_df,
            test_size=test_fraction,
            random_state=random_seed,
        )
    else:
        val_df, test_df = train_test_split(
            temp_df,
            test_size=test_fraction,
            stratify=temp_df["primary_label"],
            random_state=random_seed,
        )

    # Combine rare species back into splits
    if not rare_train_df.empty:
        train_df = pd.concat([train_df, rare_train_df], ignore_index=True)
    if not rare_val_df.empty:
        val_df = pd.concat([val_df, rare_val_df], ignore_index=True)
    if not rare_test_df.empty:
        test_df = pd.concat([test_df, rare_test_df], ignore_index=True)

    # Reset indices
    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    logger.info(f"Train: {len(train_df)} ({len(train_df)/len(df)*100:.1f}%)")
    logger.info(f"Val:   {len(val_df)} ({len(val_df)/len(df)*100:.1f}%)")
    logger.info(f"Test:  {len(test_df)} ({len(test_df)/len(df)*100:.1f}%)")
    logger.info(f"Train species: {train_df['primary_label'].nunique()}")
    logger.info(f"Val species:   {val_df['primary_label'].nunique()}")
    logger.info(f"Test species:  {test_df['primary_label'].nunique()}")

    return train_df, val_df, test_df


def save_splits(train_df, val_df, test_df, output_dir=None, logger=None):
    """
    Save the train/val/test splits to CSV files.
    
    Args:
        train_df: Training dataframe.
        val_df: Validation dataframe.
        test_df: Test dataframe.
        output_dir: Output directory (default: config.CLEANED_OUTPUT_DIR).
        logger: Optional logger instance.
    """
    output_dir = output_dir or config.CLEANED_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)

    if logger is None:
        logger = setup_logging()

    train_path = os.path.join(output_dir, "train_split.csv")
    val_path = os.path.join(output_dir, "val_split.csv")
    test_path = os.path.join(output_dir, "test_split.csv")

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    logger.info(f"Saved train split to: {train_path}")
    logger.info(f"Saved val split to:   {val_path}")
    logger.info(f"Saved test split to:  {test_path}")


def load_splits(input_dir=None):
    """
    Load previously saved train/val/test splits.
    
    Args:
        input_dir: Directory containing split CSVs (default: config.CLEANED_OUTPUT_DIR).
    
    Returns:
        tuple: (train_df, val_df, test_df)
    """
    input_dir = input_dir or config.CLEANED_OUTPUT_DIR

    train_df = pd.read_csv(os.path.join(input_dir, "train_split.csv"))
    val_df = pd.read_csv(os.path.join(input_dir, "val_split.csv"))
    test_df = pd.read_csv(os.path.join(input_dir, "test_split.csv"))

    return train_df, val_df, test_df
