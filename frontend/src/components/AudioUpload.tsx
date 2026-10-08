import React, { useState, useRef } from 'react';
import { UploadCloud, Folder, Sparkles, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface AudioUploadProps {
  onAnalyze: (file: File) => void;
  loading: boolean;
  error: string | null;
  onFileSelect?: (file: File) => void;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onAnalyze, loading, error, onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (file: File) => {
    const exts = ['.ogg', '.wav', '.mp3', '.flac', '.m4a'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!exts.includes(ext)) { alert(`Unsupported: ${ext}`); return; }
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div className="glass-card anim-3" style={{
      display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '1.3rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', marginBottom: '1rem' }}>
        <div style={{
          background: 'var(--mint-bg)', width: '36px', height: '36px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: '1px solid var(--mint-border)',
        }}>
          <UploadCloud style={{ width: '18px', height: '18px', color: 'var(--forest)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
            Upload Recording
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
            Upload wildlife audio to identify species using AI.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragEnter={handleDrag} onDragOver={handleDrag}
        onDragLeave={handleDrag} onDrop={handleDrop}
        className="dropzone-solid"
        style={{
          border: `2px dashed ${dragActive ? 'var(--forest)' : 'rgba(61,107,79,0.25)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 1rem', textAlign: 'center',
          transition: 'all 0.2s ease',
          marginBottom: '0.8rem', flex: 1, minHeight: '150px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <input
          ref={fileInputRef} type="file"
          accept="audio/ogg,audio/wav,audio/mp3,audio/flac,audio/m4a"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {/* Upload icon */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--mint-bg)', border: '1px solid var(--mint-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: '0.7rem',
          }}
        >
          <Upload style={{ width: '20px', height: '20px', color: 'var(--forest)' }} />
        </div>

        {selectedFile ? (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <span className="badge-forest" style={{ marginBottom: '0.4rem' }}>
              <CheckCircle2 style={{ width: '12px', height: '12px' }} /> File Selected
            </span>
            <h4 style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
              {selectedFile.name}
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
            </p>
          </div>
        ) : (
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.92rem', marginBottom: '0.15rem' }}>
              Drag & drop your audio file here
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>
              WAV, MP3, OGG or FLAC • Max 50 MB
            </p>
            <button onClick={() => fileInputRef.current?.click()} className="btn-outline">
              <Folder style={{ width: '14px', height: '14px', color: 'var(--forest)' }} />
              Browse File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 'var(--radius-md)', padding: '0.5rem 0.7rem', marginBottom: '0.6rem',
          color: 'var(--rose)', fontSize: '0.78rem',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={() => { if (selectedFile) onAnalyze(selectedFile); else fileInputRef.current?.click(); }}
        disabled={loading}
        className="btn-forest"
      >
        {loading ? (
          <><Sparkles style={{ width: '16px', height: '16px' }} className="loading-spinner" /> Analyzing Audio...</>
        ) : (
          <><Sparkles style={{ width: '16px', height: '16px' }} /> Analyze Audio</>
        )}
      </button>
    </div>
  );
};
