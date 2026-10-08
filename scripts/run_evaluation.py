"""
Run Evaluation Script
=====================
Standalone script to run Phase 12: Model Evaluation.

Usage:
    python scripts/run_evaluation.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.phase12_evaluation import run_evaluation

if __name__ == "__main__":
    run_evaluation()
