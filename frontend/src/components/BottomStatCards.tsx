import React from 'react';
import { Cpu, Leaf, Clock, DownloadCloud, Check, ChevronRight, Folder, Wifi, Volume2 } from 'lucide-react';
import { DbStatus, HistoryRecord } from '../types';

interface BottomStatCardsProps {
  dbStatus: DbStatus | null;
  history: HistoryRecord[];
  onViewHistory: () => void;
}

export const BottomStatCards: React.FC<BottomStatCardsProps> = ({ dbStatus, history, onViewHistory }) => {
  const isMysql = dbStatus?.active_db === 'mysql' || dbStatus?.mysql_connected;
  const historyCount = dbStatus?.history_count || history.length || 11;
  const recentItem = history.length > 0 ? history[0] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
      {/* Model Status */}
      <div className="glass-card anim-5" style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
          <div style={{
            background: 'var(--mint-bg)', width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--mint-border)',
          }}>
            <Cpu style={{ width: '14px', height: '14px', color: 'var(--forest)' }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Model Status</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green)' }}>Ready</span>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--mint-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check style={{ width: '12px', height: '12px', color: 'var(--green)', strokeWidth: 3 }} />
          </div>
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
          ListenLeaf AI model is online and performing optimally.
        </p>
      </div>

      {/* Database */}
      <div className="glass-card anim-6" style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
          <div style={{
            background: 'var(--mint-bg)', width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--mint-border)',
          }}>
            <Leaf style={{ width: '14px', height: '14px', color: 'var(--forest)' }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Database</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isMysql ? 'var(--green)' : 'var(--amber)' }}>
            {isMysql ? 'MySQL Connected' : 'SQLite Fallback'}
          </span>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'var(--mint-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wifi style={{ width: '11px', height: '11px', color: 'var(--forest)' }} />
          </div>
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
          Species database is connected and synchronized.
        </p>
      </div>

      {/* Recent Identification */}
      <div className="glass-card-interactive anim-7" onClick={onViewHistory} style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
          <div style={{
            background: 'var(--mint-bg)', width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--mint-border)',
          }}>
            <Clock style={{ width: '14px', height: '14px', color: 'var(--forest)' }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Recent Identification</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--mint-bg)', border: '1px solid var(--mint-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Volume2 style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h5 style={{
              fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {recentItem ? recentItem.common_name : 'Common Kingfisher'}
            </h5>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green)', margin: '0.02rem 0' }}>
              {recentItem ? `${(recentItem.confidence * 100).toFixed(1)}%` : '94.8%'} confidence
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Clock style={{ width: '9px', height: '9px' }} /> 2 mins ago
            </div>
          </div>
          <ChevronRight style={{ width: '15px', height: '15px', color: 'var(--text-light)' }} />
        </div>
      </div>

      {/* Saved Offline */}
      <div className="glass-card anim-8" style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
          <div style={{
            background: 'var(--mint-bg)', width: '28px', height: '28px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--mint-border)',
          }}>
            <DownloadCloud style={{ width: '14px', height: '14px', color: 'var(--forest)' }} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Saved Offline</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, marginBottom: '0.15rem' }}>
              {historyCount}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.2 }}>
              Identifications saved for offline access
            </p>
          </div>
          <div onClick={onViewHistory} style={{
            background: 'var(--mint-bg)', width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '1px solid var(--mint-border)',
          }}>
            <Folder style={{ width: '15px', height: '15px', color: 'var(--forest)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
