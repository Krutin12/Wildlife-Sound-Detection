"""
Phase 3: Audio Preprocessing
=============================
Preprocesses audio recordings:
- Load audio at 32000 Hz
- Convert stereo to mono
- Peak normalization
- Non-aggressive silence removal
- Fixed length (5 seconds) with padding/cropping

Usage:
    from src.phase03_preprocessing import AudioPreprocessor
    preprocessor = AudioPreprocessor(mode="train")
    waveform = preprocessor.process(filepath)
"""

import os
import sys

import librosa
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class AudioPreprocessor:
    """
    Audio preprocessing pipeline for the BirdCLEF 2026 dataset.
    
    Handles loading, mono conversion, normalization, silence removal,
    and fixed-length enforcement.
    
    Args:
        sample_rate: Target sample rate (default: 32000 Hz).
        duration: Target duration in seconds (default: 5).
        mode: One of 'train', 'val', 'test'. Affects cropping strategy.
    """

    def __init__(self, sample_rate=None, duration=None, mode="train"):
        self.sample_rate = sample_rate or config.SAMPLE_RATE
        self.duration = duration or config.AUDIO_DURATION
        self.target_length = int(self.sample_rate * self.duration)
        self.mode = mode

    def load_audio(self, filepath):
        """
        Load an audio file at the target sample rate using fast C soundfile reader.
        """
        try:
            import soundfile as sf
            y, sr = sf.read(filepath, dtype='float32')
            if y.ndim > 1:
                y = np.mean(y, axis=1)
            if sr != self.sample_rate:
                import scipy.signal
                num_samples = int(len(y) * self.sample_rate / sr)
                y = scipy.signal.resample(y, num_samples)
            return y
        except Exception:
            try:
                y, sr = librosa.load(filepath, sr=self.sample_rate, mono=False)
                return y
            except Exception as e:
                raise ValueError(f"Failed to load audio file {filepath}: {e}")

    def to_mono(self, y):
        """
        Convert stereo audio to mono by averaging channels.
        
        Args:
            y: Audio waveform (1D or 2D array).
        
        Returns:
            np.ndarray: Mono waveform (1D).
        """
        if y.ndim == 2:
            # Average both channels
            y = np.mean(y, axis=0)
        return y

    def peak_normalize(self, y):
        """
        Apply peak normalization to standardize loudness.
        
        Scales the waveform so that its maximum absolute value is 1.0.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Normalized waveform.
        """
        peak = np.max(np.abs(y))
        if peak > 0:
            y = y / peak
        return y

    def remove_silence(self, y):
        """
        Remove only long silent sections using an energy threshold.
        
        This is non-aggressive: only removes silences longer than
        MIN_SILENCE_DURATION. Short pauses between sounds are preserved.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Waveform with long silences removed.
        """
        # Compute frame-level energy
        frame_length = int(0.025 * self.sample_rate)  # 25ms frames
        hop_length = int(0.010 * self.sample_rate)     # 10ms hop

        # Use librosa's effects.split to find non-silent intervals
        intervals = librosa.effects.split(
            y,
            top_db=abs(config.SILENCE_THRESHOLD_DB),
            frame_length=frame_length,
            hop_length=hop_length,
        )

        if len(intervals) == 0:
            return y

        # Only remove silences longer than the threshold
        min_silence_samples = int(config.MIN_SILENCE_DURATION * self.sample_rate)
        
        result_segments = []
        for i, (start, end) in enumerate(intervals):
            result_segments.append(y[start:end])
            
            # Add back short silences between segments
            if i < len(intervals) - 1:
                gap_start = end
                gap_end = intervals[i + 1][0]
                gap_length = gap_end - gap_start
                
                if gap_length < min_silence_samples:
                    # Keep short silences (natural pauses)
                    result_segments.append(y[gap_start:gap_end])

        if result_segments:
            y = np.concatenate(result_segments)

        return y

    def fix_length(self, y):
        """
        Enforce fixed audio length by padding or cropping.
        
        - If shorter: zero-pad at the end.
        - If longer (train): random crop.
        - If longer (val/test): center crop.
        
        Args:
            y: Audio waveform.
        
        Returns:
            np.ndarray: Fixed-length waveform.
        """
        current_length = len(y)

        if current_length < self.target_length:
            # Zero padding
            padding = self.target_length - current_length
            y = np.pad(y, (0, padding), mode="constant", constant_values=0)
        elif current_length > self.target_length:
            if self.mode == "train":
                # Random crop for training
                max_start = current_length - self.target_length
                start = np.random.randint(0, max_start + 1)
                y = y[start : start + self.target_length]
            else:
                # Center crop for validation/testing
                start = (current_length - self.target_length) // 2
                y = y[start : start + self.target_length]

        return y

    def process(self, filepath):
        """
        Run the complete preprocessing pipeline on an audio file.
        
        Pipeline: load → mono → normalize → silence removal → fix length
        
        Args:
            filepath: Path to the audio file.
        
        Returns:
            np.ndarray: Preprocessed waveform (fixed length, mono, normalized).
        """
        # Step 1: Load audio
        y = self.load_audio(filepath)

        # Step 2: Convert to mono
        y = self.to_mono(y)

        # Step 3: Peak normalization
        y = self.peak_normalize(y)

        # Step 4: Remove long silences
        y = self.remove_silence(y)

        # Step 5: Fix length (pad or crop)
        y = self.fix_length(y)

        return y

    def process_waveform(self, y):
        """
        Run preprocessing on an already-loaded waveform.
        
        Useful for inference when audio is loaded from memory.
        
        Args:
            y: Raw audio waveform (numpy array).
        
        Returns:
            np.ndarray: Preprocessed waveform.
        """
        y = self.to_mono(y)
        y = self.peak_normalize(y)
        y = self.remove_silence(y)
        y = self.fix_length(y)
        return y
