"""
Run Tuning Script
=================
Standalone script to run Phase 11: Hyperparameter Tuning (Optuna).

Usage:
    python scripts/run_tuning.py
    python scripts/run_tuning.py --n-trials 50
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.phase11_tuning import run_tuning

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Optuna hyperparameter tuning")
    parser.add_argument("--n-trials", type=int, default=30, help="Number of Optuna trials")
    args = parser.parse_args()
    
    run_tuning(n_trials=args.n_trials)
