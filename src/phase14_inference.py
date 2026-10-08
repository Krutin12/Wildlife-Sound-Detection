"""
Phase 14: Prediction Pipeline
===============================
End-to-end inference pipeline for classifying audio recordings.

Pipeline:
    1. Load audio
    2. Convert to mono
    3. Normalize
    4. Trim or pad to 5 seconds
    5. Generate Log-Mel Spectrogram
    6. Normalize the spectrogram
    7. Load the trained EfficientNet-B3 model
    8. Predict the species
    9. Decode the predicted label
    10. Retrieve species information
    11. Display the results

Usage:
    python scripts/run_inference.py --audio path/to/audio.ogg

    Or programmatically:
        from src.phase14_inference import InferencePipeline
        pipeline = InferencePipeline()
        result = pipeline.predict("path/to/audio.ogg")
"""

import os
import sys

import librosa
import numpy as np
import torch
from torch.cuda.amp import autocast

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.phase03_preprocessing import AudioPreprocessor
from src.phase05_features import MelSpectrogramExtractor
from src.phase13_saving import load_model_artifacts
from src.utils import setup_logging


class InferencePipeline:
    """
    End-to-end inference pipeline for animal sound identification.
    
    Loads a trained model and preprocesses audio files for prediction.
    
    Args:
        model_dir: Directory containing saved model artifacts.
        device: Inference device.
    """

    def __init__(self, model_dir=None, device=None):
        self.device = device or config.DEVICE
        self.logger = setup_logging()

        # Load model artifacts
        self.model, self.label_processor, self.model_config = load_model_artifacts(
            device=self.device, logger=self.logger
        )

        # Initialize preprocessing pipeline (val/test mode — no augmentation)
        self.preprocessor = AudioPreprocessor(mode="test")
        self.feature_extractor = MelSpectrogramExtractor()

        # Database connection (lazy loaded)
        self._db = None

    def predict(self, audio_path, top_k=5):
        """
        Predict the species from an audio file.
        
        Args:
            audio_path: Path to the audio file (.ogg, .wav, .mp3).
            top_k: Number of top predictions to return.
        
        Returns:
            dict: Prediction result with:
                - predicted_label: Primary label of top prediction
                - common_name: Common name
                - scientific_name: Scientific name
                - confidence: Confidence score (0-1)
                - top_k_predictions: List of top-k (label, confidence) pairs
                - animal_info: Full animal info dict (if available)
        """
        # Step 1-4: Preprocess audio
        waveform = self.preprocessor.process(audio_path)

        # Step 5-6: Extract and normalize spectrogram
        spec = self.feature_extractor.extract(waveform)

        # Convert to model input tensor (3-channel for EfficientNet)
        spec_tensor = torch.from_numpy(spec).float().unsqueeze(0)  # (1, n_mels, time)
        spec_tensor = spec_tensor.repeat(3, 1, 1)  # (3, n_mels, time)
        spec_tensor = spec_tensor.unsqueeze(0)  # (1, 3, n_mels, time)
        spec_tensor = spec_tensor.to(self.device)

        # Step 7-8: Run inference
        self.model.eval()
        with torch.no_grad():
            use_amp = config.USE_MIXED_PRECISION and self.device.type == "cuda"
            if use_amp:
                with autocast():
                    logits = self.model(spec_tensor)
            else:
                logits = self.model(spec_tensor)

        # Step 9: Get predictions
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
        top_k_indices = np.argsort(probs)[-top_k:][::-1]

        # Step 10: Decode predictions
        top_k_predictions = []
        for idx in top_k_indices:
            label = self.label_processor.decode_single(idx)
            confidence = float(probs[idx])
            top_k_predictions.append({
                "label": label,
                "confidence": confidence,
            })

        predicted_label = top_k_predictions[0]["label"]
        confidence = top_k_predictions[0]["confidence"]

        # Step 11: Get animal info
        animal_info = self._get_animal_info(predicted_label)

        result = {
            "predicted_label": predicted_label,
            "confidence": confidence,
            "top_k_predictions": top_k_predictions,
            "spectrogram": spec,
            **animal_info,
        }

        return result

    def predict_from_waveform(self, waveform, sample_rate, top_k=5):
        """
        Predict from an already-loaded waveform (e.g., from file upload).
        
        Args:
            waveform: Numpy array of audio samples.
            sample_rate: Sample rate of the waveform.
            top_k: Number of top predictions.
        
        Returns:
            dict: Prediction result.
        """
        # Resample if needed
        if sample_rate != config.SAMPLE_RATE:
            waveform = librosa.resample(
                waveform, orig_sr=sample_rate, target_sr=config.SAMPLE_RATE
            )

        # Preprocess
        waveform = self.preprocessor.process_waveform(waveform)

        # Extract spectrogram
        spec = self.feature_extractor.extract(waveform)

        # Prepare tensor
        spec_tensor = torch.from_numpy(spec).float().unsqueeze(0).repeat(3, 1, 1).unsqueeze(0)
        spec_tensor = spec_tensor.to(self.device)

        # Predict
        self.model.eval()
        with torch.no_grad():
            logits = self.model(spec_tensor)

        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
        top_k_indices = np.argsort(probs)[-top_k:][::-1]

        top_k_predictions = []
        for idx in top_k_indices:
            label = self.label_processor.decode_single(idx)
            top_k_predictions.append({
                "label": label,
                "confidence": float(probs[idx]),
            })

        predicted_label = top_k_predictions[0]["label"]
        animal_info = self._get_animal_info(predicted_label)

        return {
            "predicted_label": predicted_label,
            "confidence": top_k_predictions[0]["confidence"],
            "top_k_predictions": top_k_predictions,
            "spectrogram": spec,
            **animal_info,
        }

    def _get_animal_info(self, primary_label):
        """
        Retrieve animal information from the database.
        
        Args:
            primary_label: Species primary label.
        
        Returns:
            dict: Animal information or empty dict if not found.
        """
        try:
            if self._db is None:
                from src.phase15_database import AnimalDatabase
                self._db = AnimalDatabase()

            info = self._db.get_info(primary_label)
            if info:
                return info
        except Exception:
            pass

        return {
            "common_name": primary_label,
            "scientific_name": "N/A",
            "animal_class": "N/A",
            "habitat": "N/A",
            "diet": "N/A",
            "distribution": "N/A",
            "conservation_status": "N/A",
            "interesting_facts": "N/A",
        }
