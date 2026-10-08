import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Music, Zap } from 'lucide-react';

interface CustomAudioPlayerProps {
  audioUrl: string;
  filename: string;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl, filename }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="subcard-solid" style={{ borderRadius: '14px', padding: '1.2rem', marginTop: '1rem' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Music style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            {filename}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Waveform Visualization Bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '36px', padding: '4px 8px', marginBottom: '0.8rem', background: 'var(--mint-bg)', borderRadius: '8px', overflow: 'hidden' }}>
        {Array.from({ length: 42 }).map((_, i) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const barProgress = i / 42;
          const isPassed = barProgress <= progress;
          
          // Generate a pseudo waveform pattern
          const baseHeight = Math.sin(i * 0.4) * 12 + 16;
          const animDelay = `${(i % 10) * 0.1}s`;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${baseHeight}px`,
                background: isPassed
                  ? 'linear-gradient(180deg, #10b981 0%, #06b6d4 100%)'
                  : 'var(--mint-border)',
                borderRadius: '2px',
                transition: 'background 0.2s',
                animation: isPlaying && isPassed ? `wave-bar 1.2s ease-in-out infinite alternate ${animDelay}` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Scrub Bar */}
      <input
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        style={{
          width: '100%',
          accentColor: 'var(--forest)',
          cursor: 'pointer',
          marginBottom: '1rem',
          height: '4px',
        }}
      />

      {/* Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="btn-forest"
          style={{
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(61, 107, 79, 0.3)',
            transition: 'transform 0.2s',
          }}
        >
          {isPlaying ? <Pause style={{ width: '18px', height: '18px' }} /> : <Play style={{ width: '18px', height: '18px', marginLeft: '2px' }} />}
        </button>

        {/* Playback Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--mint-bg)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
          <Zap style={{ width: '13px', height: '13px', color: 'var(--forest)' }} />
          {[0.5, 1.0, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              style={{
                background: playbackRate === rate ? 'var(--forest)' : 'transparent',
                border: 'none',
                color: playbackRate === rate ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: playbackRate === rate ? 700 : 400,
              }}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume & Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
              {isMuted ? <VolumeX style={{ width: '18px', height: '18px' }} /> : <Volume2 style={{ width: '18px', height: '18px' }} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: '60px', accentColor: 'var(--forest)', cursor: 'pointer' }}
            />
          </div>

          <a
            href={audioUrl}
            download={filename}
            className="btn-outline"
            style={{
              padding: '0.4rem 0.6rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
            }}
            title="Download Audio"
          >
            <Download style={{ width: '16px', height: '16px' }} />
          </a>
        </div>
      </div>
    </div>
  );
};
