import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

interface CircularConfidenceProps {
  confidence: number; // 0 to 1
  size?: number;
}

export const CircularConfidence: React.FC<CircularConfidenceProps> = ({ confidence, size = 150 }) => {
  const percentage = Math.round(confidence * 1000) / 10;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence * circumference);

  const getThemeColor = (conf: number) => {
    if (conf >= 0.75) return '#10b981';
    if (conf >= 0.45) return '#f59e0b';
    return '#f43f5e';
  };

  const themeColor = getThemeColor(confidence);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={themeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${themeColor}60)`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#f8fafc',
              lineHeight: 1,
            }}
          >
            {percentage}%
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: themeColor,
              marginTop: '4px',
            }}
          >
            AI CONFIDENCE
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.6rem' }}>
        <span
          className="badge-status badge-high-conf"
          style={{
            background: `${themeColor}15`,
            color: themeColor,
            border: `1px solid ${themeColor}40`,
            fontSize: '0.75rem',
          }}
        >
          <ShieldCheck style={{ width: '13px', height: '13px' }} />
          {confidence >= 0.75 ? 'High Confidence Match' : confidence >= 0.45 ? 'Moderate Confidence' : 'Low Confidence'}
        </span>
      </div>
    </div>
  );
};
