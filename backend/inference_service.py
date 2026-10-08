"""
Inference Service
=================
Encapsulates model loading, audio preprocessing, inference, and database lookup
for the FastAPI backend.
"""

import io
import os
import sys
import tempfile

import librosa
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from src.phase14_inference import InferencePipeline


class InferenceService:
    """
    Service class that wraps the inference pipeline for the API.
    
    Loads the model once at startup and provides methods for
    processing uploaded audio files.
    """

    def __init__(self):
        self.pipeline = None
        self.is_loaded = False

    def load(self):
        """Load the model and initialize the inference pipeline."""
        try:
            self.pipeline = InferencePipeline()
            self.is_loaded = True
            print("Inference service loaded successfully!")
        except Exception as e:
            print(f"ERROR loading inference service: {e}")
            self.is_loaded = False
            raise

    def predict_from_bytes(self, audio_bytes, filename="upload.ogg", top_k=5):
        """
        Predict species from raw audio bytes (file upload).
        
        Args:
            audio_bytes: Raw bytes of the audio file.
            filename: Original filename (used for format detection).
            top_k: Number of top predictions.
        
        Returns:
            dict: Prediction result.
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load() first.")

        # Save to temporary file for librosa
        suffix = os.path.splitext(filename)[1] or ".ogg"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            result = self.pipeline.predict(tmp_path, top_k=top_k)
        finally:
            os.unlink(tmp_path)

        return result

    def get_model_info(self):
        """Get model metadata."""
        if not self.is_loaded:
            return {"loaded": False}

        return {
            "loaded": True,
            "num_classes": self.pipeline.label_processor.num_classes,
            "device": str(config.DEVICE),
        }
