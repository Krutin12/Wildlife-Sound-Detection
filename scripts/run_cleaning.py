"""
Run Cleaning Script
===================
Standalone script to run Phase 2: Data Cleaning.

Usage:
    python scripts/run_cleaning.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.phase02_cleaning import run_cleaning

if __name__ == "__main__":
    run_cleaning()
