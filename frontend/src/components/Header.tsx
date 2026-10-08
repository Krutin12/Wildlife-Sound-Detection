import React from 'react';
import { Cloud, Zap, Activity, Headphones, Target, Clock } from 'lucide-react';
import { DbStatus, UserProfile } from '../types';

interface HeaderProps {
  dbStatus: DbStatus | null;
  user: UserProfile | null;
  showStats?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ dbStatus, user, showStats = false }) => {

  const stats = [
    { value: '1,248', label: 'Sounds Processed', sub: 'This Month', change: '↑ 18%', icon: Activity },
    { value: '92.4%', label: 'Avg. Accuracy', sub: 'Model Performance', change: '↑ 6.3%', icon: Target },
    { value: '312', label: 'Species Identified', sub: 'Across Database', change: '↑ 12%', icon: Headphones },
    { value: '18.7 hrs', label: 'Audio Analyzed', sub: 'This Month', change: '↑ 22%', icon: Clock },
  ];

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Aarav Singh';
  const usernameDisplay = user ? `@${user.username}` : 'Researcher';

  return (
    <div>
      {/* Top Header Row */}
      <header className="anim-1" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)',
            letterSpacing: '-0.03em', margin: 0,
          }}>
            Identify Wildlife Sound
          </h1>
          <p style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500,
            margin: '0.15rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <Zap style={{ width: '13px', height: '13px', color: 'var(--forest)' }} />
            AI Species Classification & Analysis
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="badge-forest" style={{ padding: '0.3rem 0.75rem' }}>
            <span className="pulse-dot" />
            <span>Model Online</span>
            <Cloud style={{ width: '13px', height: '13px' }} />
          </div>
        </div>
      </header>

      {/* Top Stats Row — 4 Metric Cards (Shown on Identify screen only) */}
      {showStats && (
        <div className="anim-2" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem',
          marginBottom: '1rem',
        }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="glass-card" style={{
                padding: '0.9rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.8rem',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--mint-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--mint-border)',
                }}>
                  <Icon style={{ width: '17px', height: '17px', color: 'var(--forest)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.05rem' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                    <span>{s.sub}</span>
                    <span style={{ color: 'var(--green)', fontWeight: 700 }}>{s.change}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
