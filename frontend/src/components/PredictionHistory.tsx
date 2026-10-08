import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { History, Trash2, Leaf, Calendar, FileAudio, Eye, RefreshCw, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

interface PredictionHistoryProps {
  history: HistoryRecord[];
  loading: boolean;
  onDeleteOne: (id: number) => void;
  onClearAll: () => void;
  onRefresh: () => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  history, loading, onDeleteOne, onClearAll, onRefresh,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(
    (item) =>
      item.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.predicted_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="glass-card anim-2" style={{ padding: '1.8rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 800, margin: 0,
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)',
          }}>
            <Leaf style={{ width: '21px', height: '21px', color: 'var(--forest)' }} />
            Prediction History
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
            Persistent bioacoustic classification logs from MySQL database.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={onRefresh} className="btn-outline">
            <RefreshCw style={{ width: '14px', height: '14px' }} className={loading ? 'loading-spinner' : ''} />
            Refresh
          </button>
          {history.length > 0 && (
            <button onClick={onClearAll} style={{
              background: 'rgba(220,38,38,0.08)', color: 'var(--rose)',
              border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)',
              padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontFamily: 'var(--font-sans)',
            }}>
              <Trash2 style={{ width: '14px', height: '14px' }} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.3rem', position: 'relative' }}>
        <input
          type="text" placeholder="Search by species name, code, or filename..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="input-glass"
        />
        <Search style={{
          width: '17px', height: '17px', color: 'var(--text-muted)',
          position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
        }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center' }}>
          <RefreshCw className="loading-spinner" style={{ width: '32px', height: '32px', margin: '0 auto 0.8rem auto', color: 'var(--forest)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Querying records...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="subcard-solid" style={{
          padding: '3.5rem 2rem', textAlign: 'center',
          borderRadius: 'var(--radius-xl)',
        }}>
          <History style={{ width: '42px', height: '42px', opacity: 0.2, margin: '0 auto 0.8rem auto', color: 'var(--text-muted)' }} />
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '0.3rem', fontWeight: 700 }}>
            No Saved Logs Found
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Run audio predictions to save entries into the database.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-glass" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.9rem' }}>Timestamp</th>
                <th style={{ padding: '0.5rem 0.9rem' }}>Audio File</th>
                <th style={{ padding: '0.5rem 0.9rem' }}>Identified Species</th>
                <th style={{ padding: '0.5rem 0.9rem' }}>Confidence</th>
                <th style={{ padding: '0.5rem 0.9rem' }}>Class</th>
                <th style={{ padding: '0.5rem 0.9rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => {
                const confPct = (item.confidence * 100).toFixed(1);
                const confColor = item.confidence >= 0.75 ? 'var(--green)' : item.confidence >= 0.45 ? 'var(--amber)' : 'var(--rose)';
                const isExpanded = expandedId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: isExpanded ? 0 : 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                          <Calendar style={{ width: '12px', height: '12px', color: 'var(--forest)' }} />
                          {new Date(item.created_at || Date.now()).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileAudio style={{ width: '13px', height: '13px', color: 'var(--blue)' }} />
                          {item.filename}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.85rem' }}>{item.common_name}</div>
                        <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--forest)' }}>{item.scientific_name}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem' }}>
                        <span style={{
                          background: `${confColor}15`, color: confColor, border: `1px solid ${confColor}30`,
                          fontFamily: 'var(--font-mono)', fontSize: '0.73rem', fontWeight: 700,
                          padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)',
                        }}>
                          {confPct}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {item.animal_class}
                      </td>
                      <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: isExpanded ? 0 : 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="btn-outline"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }}
                          >
                            {isExpanded ? (
                              <><ChevronUp style={{ width: '12px', height: '12px' }} /> Hide</>
                            ) : (
                              <><Eye style={{ width: '12px', height: '12px' }} /> View</>
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteOne(item.id)}
                            style={{
                              background: 'rgba(220,38,38,0.08)', border: 'none', color: 'var(--rose)',
                              padding: '0.3rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex',
                            }}
                            title="Delete log"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded Detail Subrow (No Center Popup) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 0 0.5rem 0' }}>
                          <div className="inline-subrow-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <div>
                                <span className="badge-forest" style={{ marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                                  Record #{item.id} Details
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.15rem 0' }}>
                                  {item.common_name}
                                </h3>
                                <p style={{ fontStyle: 'italic', color: 'var(--forest)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                                  {item.scientific_name}
                                </p>
                              </div>
                              <button
                                onClick={() => setExpandedId(null)}
                                style={{
                                  background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
                                  color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '8px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <X style={{ width: '14px', height: '14px' }} />
                              </button>
                            </div>

                            <div style={{
                              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '0.8rem', background: 'rgba(0,0,0,0.02)', padding: '1rem',
                              borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)',
                              marginBottom: '0.9rem', fontSize: '0.82rem',
                            }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Audio File</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.filename}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Confidence</div>
                                <div style={{ fontWeight: 800, color: confColor }}>{confPct}%</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Taxonomic Class</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.animal_class}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Habitat</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.habitat || 'Various natural habitats'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Diet</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.diet || 'Varies by species'}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Distribution</div>
                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.distribution || 'See geographical maps'}</div>
                              </div>
                            </div>

                            {item.interesting_facts && (
                              <div style={{
                                background: 'var(--mint-bg)', padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--mint-border)', fontSize: '0.82rem',
                              }}>
                                <strong style={{ color: 'var(--forest)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                                  Ecological Profile
                                </strong>
                                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-body)', lineHeight: 1.55 }}>
                                  {item.interesting_facts}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
