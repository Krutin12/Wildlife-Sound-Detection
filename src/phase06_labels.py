"""
Phase 6: Label Processing
==========================
Converts primary_label strings into integer class indices.
Saves the label encoder and class mapping for inference.

Usage:
    from src.phase06_labels import LabelProcessor
    processor = LabelProcessor()
    processor.fit(train_df)
    encoded = processor.encode(labels)
    decoded = processor.decode(predictions)
"""

import json
import os
import pickle
import sys

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class LabelProcessor:
    """
    Handles label encoding/decoding for species classification.
    
    Converts primary_label strings to integer indices and back.
    Saves and loads encoder for inference.
    """

    def __init__(self):
        self.encoder = LabelEncoder()
        self.num_classes = 0
        self.class_mapping = {}
        self.inverse_mapping = {}

    def fit(self, labels):
        """
        Fit the label encoder on the training labels.
        
        Args:
            labels: Array-like of primary_label strings.
        """
        self.encoder.fit(labels)
        self.num_classes = len(self.encoder.classes_)
        self.class_mapping = {
            label: int(idx) for idx, label in enumerate(self.encoder.classes_)
        }
        self.inverse_mapping = {
            int(idx): label for label, idx in self.class_mapping.items()
        }

    def encode(self, labels):
        """
        Encode string labels to integer indices.
        
        Args:
            labels: Array-like of primary_label strings.
        
        Returns:
            np.ndarray: Integer-encoded labels.
        """
        return self.encoder.transform(labels)

    def decode(self, indices):
        """
        Decode integer indices back to string labels.
        
        Args:
            indices: Array-like of integer indices.
        
        Returns:
            np.ndarray: Decoded string labels.
        """
        return self.encoder.inverse_transform(indices)

    def decode_single(self, index):
        """
        Decode a single integer index to its string label.
        
        Args:
            index: Integer class index.
        
        Returns:
            str: Primary label string.
        """
        return self.inverse_mapping.get(int(index), "Unknown")

    def save(self, output_dir=None):
        """
        Save the label encoder and class mapping.
        
        Saves:
            - label_encoder.pkl: Scikit-learn LabelEncoder object
            - class_mapping.json: Dictionary mapping labels to indices
        
        Args:
            output_dir: Directory to save files (default: config.MODELS_OUTPUT_DIR).
        """
        output_dir = output_dir or config.MODELS_OUTPUT_DIR
        os.makedirs(output_dir, exist_ok=True)

        # Save encoder
        encoder_path = os.path.join(output_dir, "label_encoder.pkl")
        with open(encoder_path, "wb") as f:
            pickle.dump(self.encoder, f)

        # Save class mapping
        mapping_path = os.path.join(output_dir, "class_mapping.json")
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "class_to_index": self.class_mapping,
                    "index_to_class": {str(k): v for k, v in self.inverse_mapping.items()},
                    "num_classes": self.num_classes,
                },
                f,
                indent=2,
            )

        return encoder_path, mapping_path

    def load(self, output_dir=None):
        """
        Load a previously saved label encoder and class mapping.
        
        Args:
            output_dir: Directory containing saved files (default: config.MODELS_OUTPUT_DIR).
        """
        output_dir = output_dir or config.MODELS_OUTPUT_DIR

        # Load encoder
        encoder_path = os.path.join(output_dir, "label_encoder.pkl")
        with open(encoder_path, "rb") as f:
            self.encoder = pickle.load(f)

        # Load class mapping
        mapping_path = os.path.join(output_dir, "class_mapping.json")
        with open(mapping_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.class_mapping = data["class_to_index"]
            self.inverse_mapping = {int(k): v for k, v in data["index_to_class"].items()}
            self.num_classes = data["num_classes"]
