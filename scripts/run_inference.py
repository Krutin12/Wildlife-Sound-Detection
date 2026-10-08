"""
Run Inference Script
====================
Standalone script to predict a species from an audio file.

Usage:
    python scripts/run_inference.py --audio path/to/audio.ogg
    python scripts/run_inference.py --audio path/to/audio.wav --top-k 10
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from src.utils import print_separator


def main():
    parser = argparse.ArgumentParser(description="Predict species from an audio file")
    parser.add_argument("--audio", type=str, required=True, help="Path to audio file")
    parser.add_argument("--top-k", type=int, default=5, help="Number of top predictions")
    args = parser.parse_args()

    if not os.path.exists(args.audio):
        print(f"ERROR: Audio file not found: {args.audio}")
        sys.exit(1)

    print_separator("ANIMAL SOUND IDENTIFICATION - INFERENCE")

    from src.phase14_inference import InferencePipeline

    # Initialize pipeline
    print("Loading model...")
    pipeline = InferencePipeline()

    # Predict
    print(f"Processing: {args.audio}")
    result = pipeline.predict(args.audio, top_k=args.top_k)

    # Display results
    print_separator("PREDICTION RESULT")
    print(f"  Common Name:         {result.get('common_name', 'N/A')}")
    print(f"  Scientific Name:     {result.get('scientific_name', 'N/A')}")
    print(f"  Animal Class:        {result.get('animal_class', 'N/A')}")
    print(f"  Confidence:          {result['confidence'] * 100:.1f}%")
    print(f"  Habitat:             {result.get('habitat', 'N/A')}")
    print(f"  Diet:                {result.get('diet', 'N/A')}")
    print(f"  Distribution:        {result.get('distribution', 'N/A')}")
    print(f"  Conservation Status: {result.get('conservation_status', 'N/A')}")
    print(f"  Interesting Facts:   {result.get('interesting_facts', 'N/A')}")

    print(f"\n  Top {args.top_k} Predictions:")
    for i, pred in enumerate(result["top_k_predictions"]):
        print(f"    {i+1}. {pred['label']} ({pred['confidence']*100:.1f}%)")

    print_separator()


if __name__ == "__main__":
    main()
