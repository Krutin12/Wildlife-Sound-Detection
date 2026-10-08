"""
Phase 4: Data Augmentation
===========================
Audio augmentations applied ONLY during training:
- Time Shift
- Pitch Shift
- Time Stretch
- Random Gain
- Background Noise (Gaussian)
- SpecAugment (applied on spectrograms)

Usage:
    from src.phase04_augmentation import AudioAugmentor, SpecAugment
    augmentor = AudioAugmentor()
    augmented_waveform = augmentor.augment(waveform)
    
    spec_augment = SpecAugment()
    augmented_spec = spec_augment(spectrogram)
"""

import os
import sys

import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class AudioAugmentor:
    """
    Waveform-level audio augmentations for training data.
    
    Each augmentation is applied with a given probability.
    
    Args:
        aug_config: Dictionary of augmentation parameters (default from config).
        p: Probability of applying each individual augmentation.
    """

    def __init__(self, aug_config=None, p=0.5):
        self.config = aug_config or config.AUGMENTATION_CONFIG
        self.p = p
        self.sample_rate = config.SAMPLE_RATE

    def time_shift(self, y):
        """
        Apply random circular time shift.
        
        Shifts the waveform forward or backward by a random amount,
        wrapping around to maintain length.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Time-shifted waveform.
        """
        max_shift = int(len(y) * self.config["time_shift_max"])
        shift = np.random.randint(-max_shift, max_shift + 1)
        return np.roll(y, shift)

    def pitch_shift(self, y):
        """
        Apply fast pitch shifting by linear interpolation.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Pitch-shifted waveform.
        """
        low, high = self.config["pitch_shift_range"]
        n_steps = np.random.uniform(low, high)
        if abs(n_steps) < 0.01:
            return y
        speed_ratio = 2.0 ** (n_steps / 12.0)
        orig_len = len(y)
        new_indices = np.arange(0, orig_len, speed_ratio)
        y_shifted = np.interp(new_indices, np.arange(orig_len), y)
        if len(y_shifted) > orig_len:
            return y_shifted[:orig_len]
        elif len(y_shifted) < orig_len:
            return np.pad(y_shifted, (0, orig_len - len(y_shifted)), mode="constant")
        return y_shifted

    def time_stretch(self, y):
        """
        Apply fast time stretching via linear interpolation.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Time-stretched waveform.
        """
        low, high = self.config["time_stretch_range"]
        rate = np.random.uniform(low, high)
        if abs(rate - 1.0) < 0.01:
            return y
        orig_len = len(y)
        new_indices = np.arange(0, orig_len, rate)
        y_stretched = np.interp(new_indices, np.arange(orig_len), y)
        if len(y_stretched) > orig_len:
            return y_stretched[:orig_len]
        elif len(y_stretched) < orig_len:
            return np.pad(y_stretched, (0, orig_len - len(y_stretched)), mode="constant")
        return y_stretched

    def random_gain(self, y):
        """
        Apply random gain (volume change) in dB.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Gain-adjusted waveform.
        """
        low, high = self.config["random_gain_range"]
        gain_db = np.random.uniform(low, high)
        gain_linear = 10 ** (gain_db / 20.0)
        return y * gain_linear

    def add_noise(self, y):
        """
        Add Gaussian background noise.
        
        Simulates environmental noise at a controlled amplitude.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Noisy waveform.
        """
        noise = np.random.randn(len(y)) * self.config["noise_factor"]
        return y + noise

    def augment(self, y):
        """
        Apply a random combination of augmentations.
        
        Each augmentation is applied independently with probability p.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Augmented waveform.
        """
        if np.random.random() < self.p:
            y = self.time_shift(y)

        if np.random.random() < self.p:
            y = self.pitch_shift(y)

        if np.random.random() < self.p:
            y = self.time_stretch(y)

        if np.random.random() < self.p:
            y = self.random_gain(y)

        if np.random.random() < self.p:
            y = self.add_noise(y)

        return y


class SpecAugment:
    """
    SpecAugment: Data augmentation on spectrograms.
    
    Applies frequency masking and time masking as described in
    "SpecAugment: A Simple Data Augmentation Method for ASR".
    
    Args:
        freq_mask_param: Maximum frequency bands to mask.
        time_mask_param: Maximum time steps to mask.
        num_freq_masks: Number of frequency masks to apply.
        num_time_masks: Number of time masks to apply.
    """

    def __init__(self, freq_mask_param=None, time_mask_param=None,
                 num_freq_masks=None, num_time_masks=None):
        spec_config = config.AUGMENTATION_CONFIG["spec_augment"]
        self.freq_mask_param = freq_mask_param or spec_config["freq_mask_param"]
        self.time_mask_param = time_mask_param or spec_config["time_mask_param"]
        self.num_freq_masks = num_freq_masks or spec_config["num_freq_masks"]
        self.num_time_masks = num_time_masks or spec_config["num_time_masks"]

    def __call__(self, spec):
        """
        Apply SpecAugment to a spectrogram.
        
        Args:
            spec: Spectrogram tensor of shape (n_mels, time_steps) or
                  (1, n_mels, time_steps).
        
        Returns:
            Augmented spectrogram tensor.
        """
        if isinstance(spec, np.ndarray):
            spec = torch.from_numpy(spec).float()

        original_shape = spec.shape
        
        # Handle different input shapes
        if spec.dim() == 2:
            spec = spec.unsqueeze(0)  # Add channel dim

        _, n_mels, n_time = spec.shape

        # Frequency masking
        for _ in range(self.num_freq_masks):
            f = np.random.randint(0, min(self.freq_mask_param, n_mels))
            f0 = np.random.randint(0, max(1, n_mels - f))
            spec[:, f0 : f0 + f, :] = 0

        # Time masking
        for _ in range(self.num_time_masks):
            t = np.random.randint(0, min(self.time_mask_param, n_time))
            t0 = np.random.randint(0, max(1, n_time - t))
            spec[:, :, t0 : t0 + t] = 0

        # Restore original shape
        if len(original_shape) == 2:
            spec = spec.squeeze(0)

        return spec


# Alias for alternative spelling
AudioAugmenter = AudioAugmentor
