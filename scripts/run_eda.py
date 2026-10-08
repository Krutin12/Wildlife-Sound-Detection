"""
Run EDA Script
==============
Standalone script to run Phase 1: Exploratory Data Analysis.

Usage:
    python scripts/run_eda.py
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.phase01_eda import run_eda

if __name__ == "__main__":
    run_eda()
