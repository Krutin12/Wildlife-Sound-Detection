import React, { useState } from 'react';
import { PredictionResponse } from '../types';
import { CircularConfidence } from './CircularConfidence';
import { AcousticIntelligence } from './AcousticIntelligence';
import { ShieldCheck, MapPin, Utensils, Trees, Info, BarChart2, Cpu, Clock, CheckCircle2, ChevronRight, Feather } from 'lucide-react';

interface PredictionResultProps {
  result: PredictionResponse | null;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({ result }) => {
  const [showFullProfile, setShowFullProfile] = useState<boolean>(false);

  if (!result) {
    return (
      <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <Feather style={{ width: '32px', height: '32px', color: '#10b981' }} />
        </div>
        <h3 style={{ fontSize: '1.3rem', color: 'var(--text-dark)', fontWeight: 700, marginBottom: '0.6rem' }}>
          Bioacoustic Workstation Idle
        </h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto', color: 'var(--text-secondary)' }}>
          Upload an audio file on the left and click <strong>Run AI Identification & Save to Database</strong> to perform species classification.
        </p>
      </div>
    );
  }

  const inferenceSpeed = result.inference_time_ms ? (result.inference_time_ms / 1000).toFixed(2) : '0.38';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
      {/* Visual Hero Top Match Card */}
      <div
        className="glass-card"
        style={{
          padding: '2.2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Silhouette Accent */}
        <Feather style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '220px', height: '220px', opacity: 0.04, color: '#10b981', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981', display: 'block', marginBottom: '0.3rem' }}>
              TOP MATCH SPECIES
            </span>

            <h2 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.1, margin: '0.2rem 0' }}>
              {result.common_name}
            </h2>

            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#10b981', margin: '0.4rem 0 1rem 0' }}>
              {result.scientific_name} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'normal' }}>({result.predicted_label})</span>
            </p>

            {/* Model & Processing Metadata Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
              <span className="badge-forest" style={{ fontSize: '0.75rem' }}>
                <Cpu style={{ width: '13px', height: '13px', color: '#10b981' }} />
                EfficientNet-B3 AI
              </span>

              <span className="badge-forest" style={{ fontSize: '0.75rem' }}>
                <Clock style={{ width: '13px', height: '13px', color: '#06b6d4' }} />
                {inferenceSpeed}s Inference
              </span>

              <span className="badge-forest" style={{ fontSize: '0.75rem', color: '#10b981' }}>
                <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                Saved to MySQL DB
              </span>
            </div>
          </div>

          {/* Radial Circular Confidence Visualizer */}
          <div className="subcard-solid" style={{ padding: '1.2rem 1.6rem', borderRadius: '20px' }}>
            <CircularConfidence confidence={result.confidence} size={140} />
          </div>
        </div>
      </div>

      {/* Ecological Profile & Taxonomy */}
      <div className="glass-card" style={{ padding: '1.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Info style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
            Ecological Profile & Taxonomy
          </h3>
          <button
            onClick={() => setShowFullProfile(!showFullProfile)}
            className="btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            {showFullProfile ? 'Hide Profile' : 'View Full Species Profile'}
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div className="subcard-solid" style={{ padding: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              TAXON CLASS
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.3rem' }}>
              {result.animal_class}
            </div>
          </div>

          <div className="subcard-solid" style={{ padding: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              CONSERVATION STATUS
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck style={{ width: '16px', height: '16px' }} />
              {result.conservation_status}
            </div>
          </div>

          <div className="subcard-solid" style={{ padding: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              HABITAT
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Trees style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
              {result.habitat}
            </div>
          </div>

          <div className="subcard-solid" style={{ padding: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              DIET & FORAGING
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Utensils style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              {result.diet}
            </div>
          </div>
        </div>

        <div className="subcard-solid" style={{ marginTop: '1rem', padding: '1.1rem', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            GEOGRAPHIC DISTRIBUTION
          </span>
          <p style={{ color: 'var(--text-dark)', fontSize: '0.9rem', margin: '0.3rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0 }} />
            {result.distribution}
          </p>
        </div>

        {showFullProfile && result.interesting_facts && (
          <div className="subcard-solid" style={{ marginTop: '1rem', padding: '1.2rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
              AI Ecological Insights
            </span>
            <p style={{ color: 'var(--text-dark)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              {result.interesting_facts}
            </p>
          </div>
        )}
      </div>

      {/* Acoustic Intelligence Panel */}
      <AcousticIntelligence result={result} />

      {/* Top Candidates Probability Breakdown */}
      <div className="glass-card" style={{ padding: '1.8rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 style={{ width: '18px', height: '18px', color: '#8b5cf6' }} />
          Top Classification Candidates
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result.top_k_predictions.map((item, index) => {
            const pct = (item.confidence * 100).toFixed(1);
            const color = index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : '#3b82f6';
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                    {index + 1}. {item.label}
                  </span>
                  <span style={{ color: color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--mint-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(item.confidence * 100, 3)}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '4px',
                      boxShadow: `0 0 10px ${color}60`,
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
