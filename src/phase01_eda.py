"""
Phase 1: Exploratory Data Analysis (EDA)
=========================================
Performs detailed analysis of the BirdCLEF 2026 dataset including:
- Species count and distribution
- Class imbalance analysis
- Recording duration and quality analysis
- Animal class distribution
- Duplicate and missing value detection

Usage:
    python scripts/run_eda.py
    
    Or programmatically:
        from src.phase01_eda import run_eda
        run_eda()
"""

import os
import sys
import warnings

import librosa
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from tqdm import tqdm

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator

warnings.filterwarnings("ignore")

# Set plot style
plt.style.use("seaborn-v0_8-darkgrid")
sns.set_palette("viridis")


def load_datasets(logger):
    """
    Load train.csv and taxonomy.csv.
    
    Returns:
        tuple: (train_df, taxonomy_df)
    """
    logger.info(f"Loading train.csv from: {config.TRAIN_CSV}")
    train_df = pd.read_csv(config.TRAIN_CSV)
    logger.info(f"  Train shape: {train_df.shape}")
    logger.info(f"  Columns: {list(train_df.columns)}")

    logger.info(f"Loading taxonomy.csv from: {config.TAXONOMY_CSV}")
    taxonomy_df = pd.read_csv(config.TAXONOMY_CSV)
    logger.info(f"  Taxonomy shape: {taxonomy_df.shape}")
    logger.info(f"  Columns: {list(taxonomy_df.columns)}")

    return train_df, taxonomy_df


def analyze_species(train_df, logger):
    """
    Analyze species count and recordings per species.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    
    Returns:
        pd.Series: Species counts.
    """
    print_separator("Species Analysis")
    
    total_species = train_df["primary_label"].nunique()
    total_recordings = len(train_df)
    species_counts = train_df["primary_label"].value_counts()

    logger.info(f"Total unique species: {total_species}")
    logger.info(f"Total recordings: {total_recordings}")
    logger.info(f"Average recordings per species: {total_recordings / total_species:.1f}")
    logger.info(f"Max recordings for a species: {species_counts.max()} ({species_counts.idxmax()})")
    logger.info(f"Min recordings for a species: {species_counts.min()} ({species_counts.idxmin()})")
    logger.info(f"Median recordings per species: {species_counts.median():.0f}")

    return species_counts


def plot_class_imbalance(species_counts, logger):
    """
    Plot class imbalance visualizations.
    
    Args:
        species_counts: Series with species value counts.
        logger: Logger instance.
    """
    print_separator("Class Imbalance Analysis")

    # 1. Top 30 species bar chart
    fig, axes = plt.subplots(2, 1, figsize=(16, 12))

    top_n = min(30, len(species_counts))
    species_counts.head(top_n).plot(kind="bar", ax=axes[0], color=sns.color_palette("viridis", top_n))
    axes[0].set_title(f"Top {top_n} Species by Number of Recordings", fontsize=14, fontweight="bold")
    axes[0].set_xlabel("Species (Primary Label)")
    axes[0].set_ylabel("Number of Recordings")
    axes[0].tick_params(axis="x", rotation=45, labelsize=8)

    # 2. Distribution histogram
    axes[1].hist(species_counts.values, bins=50, color="#2ecc71", edgecolor="black", alpha=0.7)
    axes[1].set_title("Distribution of Recordings per Species", fontsize=14, fontweight="bold")
    axes[1].set_xlabel("Number of Recordings")
    axes[1].set_ylabel("Number of Species")
    axes[1].axvline(species_counts.mean(), color="red", linestyle="--", label=f"Mean: {species_counts.mean():.0f}")
    axes[1].axvline(species_counts.median(), color="blue", linestyle="--", label=f"Median: {species_counts.median():.0f}")
    axes[1].legend()

    plt.tight_layout()
    save_path = os.path.join(config.EDA_OUTPUT_DIR, "class_imbalance.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved class imbalance plot to: {save_path}")

    # Imbalance ratio
    imbalance_ratio = species_counts.max() / species_counts.min()
    logger.info(f"Imbalance ratio (max/min): {imbalance_ratio:.1f}x")

    # Species with very few recordings
    few_recordings = (species_counts < 10).sum()
    logger.info(f"Species with < 10 recordings: {few_recordings}")


def analyze_duration(train_df, logger, sample_size=500):
    """
    Analyze recording durations by sampling audio files.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
        sample_size: Number of files to sample for duration analysis.
    """
    print_separator("Recording Duration Analysis")

    durations = []
    # Sample files for duration analysis (full scan is too slow for large datasets)
    sample_df = train_df.sample(n=min(sample_size, len(train_df)), random_state=config.RANDOM_SEED)

    logger.info(f"Sampling {len(sample_df)} files for duration analysis...")

    for _, row in tqdm(sample_df.iterrows(), total=len(sample_df), desc="Analyzing durations"):
        filepath = os.path.join(config.TRAIN_AUDIO_DIR, row["filename"])
        if os.path.exists(filepath):
            try:
                duration = librosa.get_duration(path=filepath)
                durations.append(duration)
            except Exception:
                pass

    if not durations:
        logger.warning("No audio files found for duration analysis!")
        return

    durations = np.array(durations)
    logger.info(f"Duration statistics (from {len(durations)} files):")
    logger.info(f"  Mean: {durations.mean():.1f}s")
    logger.info(f"  Median: {np.median(durations):.1f}s")
    logger.info(f"  Min: {durations.min():.1f}s")
    logger.info(f"  Max: {durations.max():.1f}s")
    logger.info(f"  Std: {durations.std():.1f}s")
    logger.info(f"  < 5s: {(durations < 5).sum()} ({(durations < 5).mean() * 100:.1f}%)")
    logger.info(f"  > 60s: {(durations > 60).sum()} ({(durations > 60).mean() * 100:.1f}%)")

    # Plot
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.hist(durations, bins=50, color="#3498db", edgecolor="black", alpha=0.7)
    ax.set_title("Recording Duration Distribution (Sampled)", fontsize=14, fontweight="bold")
    ax.set_xlabel("Duration (seconds)")
    ax.set_ylabel("Count")
    ax.axvline(durations.mean(), color="red", linestyle="--", label=f"Mean: {durations.mean():.1f}s")
    ax.axvline(5.0, color="green", linestyle="--", label="Target: 5.0s")
    ax.legend()

    plt.tight_layout()
    save_path = os.path.join(config.EDA_OUTPUT_DIR, "duration_distribution.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved duration distribution plot to: {save_path}")


def analyze_rating(train_df, logger):
    """
    Analyze recording quality using the rating column.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    """
    print_separator("Recording Quality (Rating) Analysis")

    if "rating" not in train_df.columns:
        logger.warning("'rating' column not found in train.csv. Skipping rating analysis.")
        return

    rating_counts = train_df["rating"].value_counts().sort_index()
    logger.info("Rating distribution:")
    for rating, count in rating_counts.items():
        pct = count / len(train_df) * 100
        logger.info(f"  Rating {rating}: {count} ({pct:.1f}%)")

    # Recordings that would be kept with rating >= 3
    kept = (train_df["rating"] >= config.MIN_RATING).sum()
    logger.info(f"Recordings with rating >= {config.MIN_RATING}: {kept} ({kept / len(train_df) * 100:.1f}%)")
    logger.info(f"Recordings that would be removed: {len(train_df) - kept}")

    # Plot
    fig, ax = plt.subplots(figsize=(10, 5))
    colors = ["#e74c3c" if r < config.MIN_RATING else "#2ecc71" for r in rating_counts.index]
    rating_counts.plot(kind="bar", ax=ax, color=colors, edgecolor="black")
    ax.set_title("Recording Quality Distribution (Rating)", fontsize=14, fontweight="bold")
    ax.set_xlabel("Rating")
    ax.set_ylabel("Number of Recordings")
    ax.axvline(config.MIN_RATING - 0.5 - rating_counts.index.min(), color="red", linestyle="--",
               linewidth=2, label=f"Threshold (>= {config.MIN_RATING})")
    ax.legend()
    ax.tick_params(axis="x", rotation=0)

    plt.tight_layout()
    save_path = os.path.join(config.EDA_OUTPUT_DIR, "rating_distribution.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved rating distribution plot to: {save_path}")


def analyze_animal_classes(train_df, taxonomy_df, logger):
    """
    Analyze distribution of animal classes (Birds, Mammals, Amphibians, etc.).
    
    Args:
        train_df: Training dataframe.
        taxonomy_df: Taxonomy dataframe.
        logger: Logger instance.
    """
    print_separator("Animal Class Distribution")

    if taxonomy_df is None or taxonomy_df.empty:
        logger.info("Taxonomy data not available. Skipping animal class distribution.")
        return

    try:
        # Strip column names whitespace
        taxonomy_df = taxonomy_df.copy()
        taxonomy_df.columns = taxonomy_df.columns.astype(str).str.strip()

        # Try to find the class column in taxonomy
        class_col = None
        for col_name in ["class", "class_name", "Class", "animal_class", "category", "taxon_class"]:
            if col_name in taxonomy_df.columns:
                class_col = col_name
                break

        if class_col is None:
            # Check for case-insensitive column match
            cols_lower = {col.lower(): col for col in taxonomy_df.columns}
            for cand in ["class", "class_name", "animal_class", "category", "taxon_class"]:
                if cand in cols_lower:
                    class_col = cols_lower[cand]
                    break

        if class_col is None or class_col not in taxonomy_df.columns:
            logger.info("No explicit 'class' column found in taxonomy dataframe.")
            logger.info(f"Taxonomy columns available: {list(taxonomy_df.columns)}")
            if "order" in taxonomy_df.columns:
                logger.info(f"Unique orders ({taxonomy_df['order'].nunique()}): {taxonomy_df['order'].unique()[:10]}")
            return

        # Find the label column in taxonomy
        label_col = None
        for col_name in ["primary_label", "species_code", "label", "ebird_code"]:
            if col_name in taxonomy_df.columns:
                label_col = col_name
                break

        if label_col is None or label_col not in taxonomy_df.columns:
            logger.warning("Cannot find matching label column in taxonomy.")
            return

        merged = train_df.merge(taxonomy_df[[label_col, class_col]], 
                                left_on="primary_label", right_on=label_col, how="left")

        if class_col not in merged.columns:
            logger.warning(f"Class column '{class_col}' not found after merge.")
            return

        class_counts = merged[class_col].value_counts(dropna=False)
        logger.info("Animal class distribution:")
        for cls, count in class_counts.items():
            pct = count / len(merged) * 100
            logger.info(f"  {cls}: {count} recordings ({pct:.1f}%)")

        # Plot if valid classes exist
        if len(class_counts) > 0:
            fig, axes = plt.subplots(1, 2, figsize=(14, 6))

            class_counts.plot(kind="bar", ax=axes[0], color=sns.color_palette("Set2", len(class_counts)),
                              edgecolor="black")
            axes[0].set_title("Recordings per Animal Class", fontsize=14, fontweight="bold")
            axes[0].set_xlabel("Animal Class")
            axes[0].set_ylabel("Number of Recordings")
            axes[0].tick_params(axis="x", rotation=45)

            axes[1].pie(class_counts.values, labels=class_counts.index, autopct="%1.1f%%",
                        colors=sns.color_palette("Set2", len(class_counts)), startangle=90)
            axes[1].set_title("Animal Class Proportion", fontsize=14, fontweight="bold")

            plt.tight_layout()
            save_path = os.path.join(config.EDA_OUTPUT_DIR, "animal_class_distribution.png")
            plt.savefig(save_path, dpi=150, bbox_inches="tight")
            plt.close()
            logger.info(f"Saved animal class distribution plot to: {save_path}")

    except Exception as e:
        logger.warning(f"Could not complete animal class distribution analysis: {e}")


def detect_duplicates(train_df, logger):
    """
    Detect duplicate records in the dataset.
    
    Args:
        train_df: Training dataframe.
        logger: Logger instance.
    """
    print_separator("Duplicate Detection")

    # Full row duplicates
    full_dupes = train_df.duplicated().sum()
    logger.info(f"Full row duplicates: {full_dupes}")

    # Filename duplicates
    filename_dupes = train_df["filename"].duplicated().sum()
    logger.info(f"Filename duplicates: {filename_dupes}")

    if filename_dupes > 0:
        dupe_files = train_df[train_df["filename"].duplicated(keep=False)]
        logger.info(f"  Sample duplicate filenames:\n{dupe_files.head(10)[['filename', 'primary_label']].to_string()}")


def detect_missing_values(train_df, taxonomy_df, logger):
    """
    Detect missing values in both dataframes.
    
    Args:
        train_df: Training dataframe.
        taxonomy_df: Taxonomy dataframe.
        logger: Logger instance.
    """
    print_separator("Missing Value Detection")

    logger.info("Missing values in train.csv:")
    train_missing = train_df.isnull().sum()
    for col, count in train_missing.items():
        if count > 0:
            pct = count / len(train_df) * 100
            logger.info(f"  {col}: {count} ({pct:.1f}%)")
    if train_missing.sum() == 0:
        logger.info("  No missing values found!")

    logger.info("\nMissing values in taxonomy.csv:")
    tax_missing = taxonomy_df.isnull().sum()
    for col, count in tax_missing.items():
        if count > 0:
            pct = count / len(taxonomy_df) * 100
            logger.info(f"  {col}: {count} ({pct:.1f}%)")
    if tax_missing.sum() == 0:
        logger.info("  No missing values found!")


def generate_eda_report(train_df, taxonomy_df, species_counts, logger):
    """
    Generate a comprehensive text EDA report.
    
    Args:
        train_df: Training dataframe.
        taxonomy_df: Taxonomy dataframe.
        species_counts: Species value counts.
        logger: Logger instance.
    """
    report_path = os.path.join(config.EDA_OUTPUT_DIR, "eda_report.txt")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 70 + "\n")
        f.write("  ANIMAL SOUND IDENTIFICATION SYSTEM - EDA REPORT\n")
        f.write("  BirdCLEF 2026 Dataset\n")
        f.write("=" * 70 + "\n\n")

        f.write("DATASET OVERVIEW\n")
        f.write("-" * 40 + "\n")
        f.write(f"Total recordings: {len(train_df)}\n")
        f.write(f"Total unique species: {train_df['primary_label'].nunique()}\n")
        f.write(f"Train CSV columns: {list(train_df.columns)}\n")
        f.write(f"Taxonomy CSV columns: {list(taxonomy_df.columns)}\n\n")

        f.write("SPECIES STATISTICS\n")
        f.write("-" * 40 + "\n")
        f.write(f"Average recordings per species: {len(train_df) / train_df['primary_label'].nunique():.1f}\n")
        f.write(f"Max recordings: {species_counts.max()} ({species_counts.idxmax()})\n")
        f.write(f"Min recordings: {species_counts.min()} ({species_counts.idxmin()})\n")
        f.write(f"Median recordings: {species_counts.median():.0f}\n")
        f.write(f"Species with < 10 recordings: {(species_counts < 10).sum()}\n")
        f.write(f"Imbalance ratio: {species_counts.max() / species_counts.min():.1f}x\n\n")

        if "rating" in train_df.columns:
            f.write("QUALITY STATISTICS\n")
            f.write("-" * 40 + "\n")
            rating_counts = train_df["rating"].value_counts().sort_index()
            for rating, count in rating_counts.items():
                f.write(f"Rating {rating}: {count} ({count / len(train_df) * 100:.1f}%)\n")
            kept = (train_df["rating"] >= config.MIN_RATING).sum()
            f.write(f"\nRecordings with rating >= {config.MIN_RATING}: {kept} ({kept / len(train_df) * 100:.1f}%)\n\n")

        f.write("MISSING VALUES\n")
        f.write("-" * 40 + "\n")
        missing = train_df.isnull().sum()
        if missing.sum() == 0:
            f.write("No missing values in train.csv\n")
        else:
            for col, count in missing.items():
                if count > 0:
                    f.write(f"{col}: {count} ({count / len(train_df) * 100:.1f}%)\n")

        f.write(f"\nDuplicates: {train_df.duplicated().sum()}\n")
        f.write(f"Filename duplicates: {train_df['filename'].duplicated().sum()}\n")

    logger.info(f"Saved EDA report to: {report_path}")


def run_eda():
    """
    Run the complete EDA pipeline.
    
    This function performs all EDA tasks and saves outputs to the EDA output directory.
    """
    config.create_output_dirs()
    logger = setup_logging(
        log_file=os.path.join(config.LOGS_OUTPUT_DIR, "phase01_eda.log")
    )

    print_separator("PHASE 1: EXPLORATORY DATA ANALYSIS")
    logger.info("Starting Exploratory Data Analysis...")

    # Load datasets
    train_df, taxonomy_df = load_datasets(logger)

    # Species analysis
    species_counts = analyze_species(train_df, logger)

    # Class imbalance
    plot_class_imbalance(species_counts, logger)

    # Duration analysis
    analyze_duration(train_df, logger)

    # Rating analysis
    analyze_rating(train_df, logger)

    # Animal class distribution
    analyze_animal_classes(train_df, taxonomy_df, logger)

    # Duplicates
    detect_duplicates(train_df, logger)

    # Missing values
    detect_missing_values(train_df, taxonomy_df, logger)

    # Generate report
    generate_eda_report(train_df, taxonomy_df, species_counts, logger)

    print_separator("EDA COMPLETE")
    logger.info(f"All EDA outputs saved to: {config.EDA_OUTPUT_DIR}")


if __name__ == "__main__":
    run_eda()
