"""
Phase 5: Feature Extraction
============================
Converts audio waveforms into Log-Mel Spectrograms.

Parameters:
    - Sample Rate: 32000 Hz
    - n_fft: 1024
    - hop_length: 320
    - n_mels: 128
    - fmin: 20 Hz
    - fmax: 16000 Hz

Usage:
    from src.phase05_features import MelSpectrogramExtractor
    extractor = MelSpectrogramExtractor()
    spectrogram = extractor.extract(waveform)
"""

import os
import sys

import librosa
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class MelSpectrogramExtractor:
    """
    Extracts Log-Mel Spectrograms from audio waveforms.
    
    Args:
        sample_rate: Audio sample rate.
        n_fft: FFT window size.
        hop_length: Hop length for STFT.
        n_mels: Number of mel bands.
        fmin: Minimum frequency.
        fmax: Maximum frequency.
        normalize: Whether to normalize the spectrogram.
    """

    def __init__(self, sample_rate=None, n_fft=None, hop_length=None,
                 n_mels=None, fmin=None, fmax=None, normalize=True):
        self.sample_rate = sample_rate or config.SAMPLE_RATE
        self.n_fft = n_fft or config.N_FFT
        self.hop_length = hop_length or config.HOP_LENGTH
        self.n_mels = n_mels or config.N_MELS
        self.fmin = fmin or config.F_MIN
        self.fmax = fmax or config.F_MAX
        self.normalize = normalize

        try:
            import torchaudio.transforms as T
            self.mel_transform = T.MelSpectrogram(
                sample_rate=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels,
                f_min=self.fmin,
                f_max=self.fmax,
                power=2.0,
            )
            self.amplitude_to_db = T.AmplitudeToDB(top_db=80.0)
            self.use_torchaudio = True
        except Exception:
            self.use_torchaudio = False

    def extract(self, y):
        """
        Extract a Log-Mel Spectrogram from a waveform.
        """
        if self.use_torchaudio:
            if isinstance(y, np.ndarray):
                y_tensor = torch.from_numpy(y).float()
            else:
                y_tensor = y.float()

            if y_tensor.dim() == 1:
                y_tensor = y_tensor.unsqueeze(0)

            with torch.no_grad():
                mel_spec = self.mel_transform(y_tensor)
                log_mel_spec = self.amplitude_to_db(mel_spec).squeeze(0).numpy()
        else:
            mel_spec = librosa.feature.melspectrogram(
                y=y,
                sr=self.sample_rate,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
                n_mels=self.n_mels,
                fmin=self.fmin,
                fmax=self.fmax,
                power=2.0,
            )
            log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

        if self.normalize:
            log_mel_spec = self.normalize_spectrogram(log_mel_spec)

        return log_mel_spec

    def normalize_spectrogram(self, spec):
        """
        Normalize a spectrogram to zero-mean, unit-variance.
        
        Args:
            spec: Spectrogram array.
        
        Returns:
            np.ndarray: Normalized spectrogram.
        """
        mean = np.mean(spec)
        std = np.std(spec)
        if std > 0:
            spec = (spec - mean) / std
        else:
            spec = spec - mean
        return spec

    def extract_to_tensor(self, y):
        """
        Extract a Log-Mel Spectrogram and convert to a PyTorch tensor.
        
        The output tensor has shape (1, n_mels, time_steps) suitable for
        CNN input (single channel).
        
        Args:
            y: Audio waveform.
        
        Returns:
            torch.Tensor: Spectrogram tensor of shape (1, n_mels, time_steps).
        """
        spec = self.extract(y)
        # Convert to 3-channel by repeating (for pretrained models expecting RGB)
        spec_tensor = torch.from_numpy(spec).float().unsqueeze(0)
        # Repeat to 3 channels for EfficientNet (expects RGB input)
        spec_tensor = spec_tensor.repeat(3, 1, 1)
        return spec_tensor

    def get_spectrogram_shape(self):
        """
        Calculate the expected spectrogram shape for the configured parameters.
        
        Returns:
            tuple: (n_mels, time_steps)
        """
        target_length = config.SAMPLE_RATE * config.AUDIO_DURATION
        time_steps = 1 + target_length // self.hop_length
        return (self.n_mels, time_steps)
