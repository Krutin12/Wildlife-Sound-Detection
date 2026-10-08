import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Play, Pause, SlidersHorizontal, Target, Volume2, CheckCircle2, BarChart2 } from 'lucide-react';
import { PredictionResponse } from '../types';

interface AnalysisPreviewProps {
  result: PredictionResponse | null;
  audioFile?: File | null;
}

// Number of bars in the waveform visualization
const BAR_COUNT = 100;

export const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({ result, audioFile }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const animFrameRef = useRef<number>(0);

  // Decode audio file into waveform amplitude data
  useEffect(() => {
    if (!audioFile) {
      setWaveformData([]);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    // Create object URL for playback
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const url = URL.createObjectURL(audioFile);
    audioUrlRef.current = url;

    // Set up audio element
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => { setIsPlaying(false); setCurrentTime(0); });

    // Decode audio data for waveform
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(reader.result as ArrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        // Downsample to BAR_COUNT bars
        const blockSize = Math.floor(channelData.length / BAR_COUNT);
        const bars: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = start; j < start + blockSize && j < channelData.length; j++) {
            sum += Math.abs(channelData[j]);
          }
          bars.push(sum / blockSize);
        }

        // Normalize to 0-1
        const max = Math.max(...bars, 0.01);
        setWaveformData(bars.map((b) => b / max));

        audioContext.close();
      } catch (err) {
        console.error('Failed to decode audio:', err);
        // Fallback: generate placeholder waveform
        setWaveformData(
          Array.from({ length: BAR_COUNT }, (_, i) =>
            Math.abs(Math.sin(i * 0.22) * Math.cos(i * 0.08)) * 0.8 + 0.1
          )
        );
      }
    };
    reader.readAsArrayBuffer(audioFile);

    return () => {
      audio.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioFile]);

  // Sync current time during playback
  useEffect(() => {
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Confidence ring SVG
  const ConfidenceRing = ({ value }: { value: number }) => {
    const pct = value * 100;
    const circ = 2 * Math.PI * 40;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 75 ? 'var(--green)' : pct >= 45 ? 'var(--amber)' : 'var(--rose)';

    return (
      <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="40" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
          <circle cx="42" cy="42" r="40" fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 42 42)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>
            {pct.toFixed(0)}%
          </span>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confidence</span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card anim-4" style={{
      display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '1.3rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', marginBottom: '1rem' }}>
        <div style={{
          background: 'var(--mint-bg)', width: '36px', height: '36px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: '1px solid var(--mint-border)',
        }}>
          <Activity style={{ width: '18px', height: '18px', color: 'var(--forest)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
            Analysis Preview
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
            Preview and process audio for species identification.
          </p>
        </div>
      </div>

      {/* Waveform — generated from real audio data */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '56px', marginBottom: '0.6rem', padding: '0 0.2rem',
        width: '100%', overflow: 'hidden',
      }}>
        {waveformData.length > 0 ? (
          waveformData.map((amp, i) => {
            const h = Math.max(3, amp * 48);
            const barProgress = (i / BAR_COUNT) * 100;
            const isPlayed = barProgress <= progress;
            return (
              <div key={i} style={{
                display: 'inline-block',
                width: '2.5px',
                height: `${h}px`,
                background: isPlayed ? 'var(--forest)' : 'var(--forest)',
                opacity: isPlayed ? 0.85 : 0.35,
                borderRadius: '2px',
                marginRight: '1.5px',
                transition: 'opacity 0.15s ease',
              }} />
            );
          })
        ) : (
          // Placeholder waveform when no file loaded
          Array.from({ length: BAR_COUNT }, (_, i) => {
            const h = Math.abs(Math.sin(i * 0.22) * Math.cos(i * 0.08) * 40) + 4;
            return (
              <div key={i} style={{
                display: 'inline-block', width: '2.5px', height: `${h}px`,
                background: 'var(--forest)', opacity: 0.2,
                borderRadius: '2px', marginRight: '1.5px',
              }} />
            );
          })
        )}
      </div>

      {/* Player Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', width: '100%', flexWrap: 'wrap' }}>
        <button onClick={togglePlay} disabled={!audioFile} style={{
          background: audioFile ? 'var(--forest)' : 'var(--sage)',
          color: '#fff', border: 'none', borderRadius: '50%',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: audioFile ? 'pointer' : 'not-allowed', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(45,90,58,0.25)', opacity: audioFile ? 1 : 0.5,
        }}>
          {isPlaying ? <Pause style={{ width: '14px', height: '14px' }} /> : <Play style={{ width: '14px', height: '14px', marginLeft: '2px' }} />}
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: '36px' }}>
          {formatTime(currentTime)}
        </span>

        <div
          onClick={seekTo}
          style={{
            flex: 1, height: '4px', background: 'rgba(0,0,0,0.08)',
            borderRadius: '2px', position: 'relative', cursor: audioFile ? 'pointer' : 'default',
          }}
        >
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'var(--forest)', borderRadius: '2px',
            transition: 'width 0.1s linear',
          }} />
          {audioFile && (
            <div style={{
              width: '10px', height: '10px',
              background: 'var(--forest)', borderRadius: '50%',
              position: 'absolute', left: `${progress}%`, top: '-3px',
              transform: 'translateX(-5px)',
              boxShadow: '0 0 6px rgba(45,90,58,0.3)',
            }} />
          )}
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: '36px' }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="badge-forest">
          <SlidersHorizontal style={{ width: '11px', height: '11px' }} /> Noise Reduction
        </div>
        <div className="badge-forest">
          <Target style={{ width: '11px', height: '11px' }} /> High Accuracy
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div style={{
          background: 'rgba(61,107,79,0.06)', borderRadius: 'var(--radius-lg)',
          padding: '1.1rem', border: '1px solid var(--mint-border)', flex: 1,
          animation: 'fadeInUp 0.4s ease-out',
          display: 'flex', flexDirection: 'column', gap: '0.8rem',
        }}>
          <div className="analysis-preview-flex">
            {/* Left Column: Species Info & Pie Chart */}
            <div className="analysis-preview-col-left">
              <div>
                <span className="badge-forest" style={{ marginBottom: '0.4rem', fontSize: '0.68rem' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }} /> Species Identified
                </span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.2rem 0', lineHeight: 1.2 }}>
                  {result.common_name}
                </h4>
                <p style={{ fontStyle: 'italic', color: 'var(--forest)', fontSize: '0.82rem', margin: '0 0 0.5rem 0' }}>
                  {result.scientific_name}
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Class</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{result.animal_class}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Status</span>
                    <strong style={{ color: 'var(--forest)' }}>{result.conservation_status}</strong>
                  </div>
                </div>
              </div>
              <ConfidenceRing value={result.confidence} />
            </div>

            {/* Right Column: Top 5 Predictions Breakdown */}
            {result.top_k_predictions && result.top_k_predictions.length > 0 && (
              <div className="analysis-preview-col-right">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.2rem',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: 'var(--forest)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    <BarChart2 style={{ width: '13px', height: '13px' }} />
                    Top 5 Predictions
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Confidence
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {result.top_k_predictions.slice(0, 5).map((item, idx) => {
                    const pct = (item.confidence * 100).toFixed(1);
                    const isTop = idx === 0;
                    const barColor = isTop ? 'var(--forest)' : idx === 1 ? '#06b6d4' : idx === 2 ? '#3b82f6' : 'var(--sage)';

                    return (
                      <div
                        key={item.label + idx}
                        className="subcard-solid"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.3rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          border: isTop ? '1px solid var(--forest)' : '1px solid var(--mint-border)',
                        }}
                      >
                        {/* Rank Badge */}
                        <span style={{
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          lineHeight: '20px',
                          textAlign: 'center',
                          borderRadius: '50%',
                          background: isTop ? 'var(--forest)' : 'rgba(0,0,0,0.12)',
                          color: isTop ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          padding: 0,
                          margin: 0,
                        }}>
                          {idx + 1}
                        </span>

                        {/* Species Label */}
                        <span style={{
                          fontSize: '0.73rem',
                          fontWeight: isTop ? 800 : 600,
                          color: 'var(--text-dark)',
                          width: '75px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flexShrink: 0,
                        }}>
                          {item.label}
                        </span>

                        {/* In-Line Progress Track */}
                        <div style={{
                          flex: 1,
                          height: '5px',
                          background: 'rgba(0, 0, 0, 0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${Math.max(item.confidence * 100, 2)}%`,
                            height: '100%',
                            background: barColor,
                            borderRadius: '3px',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>

                        {/* Percentage Score */}
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: barColor,
                          width: '42px',
                          textAlign: 'right',
                          flexShrink: 0,
                        }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="subcard-solid" style={{
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1rem', textAlign: 'center', flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed var(--mint-border)', minHeight: '120px',
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: 'var(--mint-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.6rem',
          }}>
            <Volume2 style={{ width: '20px', height: '20px', color: 'var(--forest)' }} />
          </div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
            Upload a recording to begin
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '260px', margin: 0 }}>
            Your audio preview and results will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
