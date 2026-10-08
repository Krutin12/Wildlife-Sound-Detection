import React, { useState } from 'react';
import { HistoryRecord, DbStatus } from '../types';
import { BarChart2, Activity, Headphones, Target, ShieldCheck, PieChart, Layers, Calendar, Sparkles, AlertCircle, Leaf } from 'lucide-react';

interface AnalyticsDashboardProps {
  history: HistoryRecord[];
  dbStatus: DbStatus | null;
  onNavigateToUpload?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ history, dbStatus, onNavigateToUpload }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Filter history by time range
  const now = Date.now();
  const filteredHistory = history.filter(h => {
    if (timeRange === 'all') return true;
    const createdAt = new Date(h.created_at || Date.now()).getTime();
    const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
    return timeRange === '7d' ? daysDiff <= 7 : daysDiff <= 30;
  });

  // Dynamic Key Metrics
  const totalDetections = filteredHistory.length;
  const avgConfidenceNum = totalDetections > 0
    ? filteredHistory.reduce((acc, curr) => acc + curr.confidence, 0) / totalDetections * 100
    : 0;
  const avgConfidence = avgConfidenceNum.toFixed(1);
  const uniqueSpecies = new Set(filteredHistory.map(h => h.common_name)).size;

  // Dynamic Animal Class Distribution
  const classMap: Record<string, number> = {};
  filteredHistory.forEach(h => {
    const cls = h.animal_class || 'Aves';
    classMap[cls] = (classMap[cls] || 0) + 1;
  });

  const classColors: Record<string, string> = {
    Aves: '#3d6b4f',
    Mammalia: '#06b6d4',
    Amphibia: '#eab308',
    Reptilia: '#ec4899',
    Insecta: '#a855f7',
  };

  const classData = Object.entries(classMap)
    .map(([label, count]) => ({
      label,
      count,
      color: classColors[label] || '#5a9e6f',
      pct: totalDetections > 0 ? Math.round((count / totalDetections) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Dynamic 7-Day Activity Timeline
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  filteredHistory.forEach(h => {
    const d = new Date(h.created_at || Date.now());
    const dayName = daysOfWeek[d.getDay()];
    if (activityMap[dayName] !== undefined) {
      activityMap[dayName] += 1;
    }
  });

  const activityData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    count: activityMap[day] || 0,
  }));

  const maxActivity = Math.max(...activityData.map(a => a.count), 1);

  // Dynamic Confidence Buckets
  const vHigh = filteredHistory.filter(h => h.confidence >= 0.90).length;
  const high = filteredHistory.filter(h => h.confidence >= 0.75 && h.confidence < 0.90).length;
  const mod = filteredHistory.filter(h => h.confidence >= 0.50 && h.confidence < 0.75).length;
  const low = filteredHistory.filter(h => h.confidence < 0.50).length;

  const confidenceBuckets = [
    { range: 'Very High (90% - 100%)', count: vHigh, color: '#22c55e', pct: totalDetections > 0 ? Math.round((vHigh / totalDetections) * 100) : 0 },
    { range: 'High (75% - 89%)', count: high, color: '#3b82f6', pct: totalDetections > 0 ? Math.round((high / totalDetections) * 100) : 0 },
    { range: 'Moderate (50% - 74%)', count: mod, color: '#f59e0b', pct: totalDetections > 0 ? Math.round((mod / totalDetections) * 100) : 0 },
    { range: 'Ambiguous (< 50%)', count: low, color: '#f43f5e', pct: totalDetections > 0 ? Math.round((low / totalDetections) * 100) : 0 },
  ];

  // Dynamic Species Frequency Ranking
  const speciesMap = new Map<string, { common: string; scientific: string; class: string; count: number; sumConf: number }>();
  filteredHistory.forEach(h => {
    const key = h.common_name;
    const existing = speciesMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.sumConf += h.confidence;
    } else {
      speciesMap.set(key, {
        common: h.common_name,
        scientific: h.scientific_name,
        class: h.animal_class || 'Aves',
        count: 1,
        sumConf: h.confidence,
      });
    }
  });

  const topSpeciesList = Array.from(speciesMap.values())
    .map(s => ({
      name: s.common,
      scientific: s.scientific,
      class: s.class,
      count: s.count,
      conf: ((s.sumConf / s.count) * 100).toFixed(1) + '%',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* ─── HEADER BAR ─── */}
      <div className="glass-card anim-1" style={{
        padding: '1.2rem 1.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.8rem',
      }}>
        <div>
          <h2 style={{
            fontSize: '1.35rem', fontWeight: 800, margin: 0,
            display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)',
          }}>
            <BarChart2 style={{ width: '22px', height: '22px', color: 'var(--forest)' }} />
            Bioacoustic Analytics & Diagnostics
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
            Real-time calculations computed 100% dynamically from MySQL database records.
          </p>
        </div>

        {/* Sleek Segmented Time Filter Bar */}
        <div className="subcard-solid" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem',
          borderRadius: 'var(--radius-lg)',
          gap: '0.25rem',
        }}>
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tab) => {
            const isActive = timeRange === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id as any)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 600,
                  background: isActive ? 'var(--forest)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-dark)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(45,90,58,0.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* If No History Records in Database */}
      {history.length === 0 ? (
        <div className="glass-card anim-2" style={{
          padding: '3.5rem 2rem', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--mint-bg)', border: '1px solid var(--mint-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <Leaf style={{ width: '26px', height: '26px', color: 'var(--forest)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
            No Database Predictions Logged Yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 0 1.2rem 0', lineHeight: 1.5 }}>
            Upload wildlife audio recordings to run predictions. Real-time class distributions, accuracy curves, and species call rankings will automatically generate here.
          </p>
        </div>
      ) : (
        <>
          {/* ─── DYNAMIC KPI SUMMARY CARDS ─── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem',
          }}>
            <div className="glass-card anim-2" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Audio Processed</span>
                <div style={{ background: 'var(--mint-bg)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--mint-border)' }}>
                  <Headphones style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.1 }}>
                {totalDetections} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>logs</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--forest)', fontWeight: 700, marginTop: '0.4rem' }}>
                From MySQL Database
              </div>
            </div>

            <div className="glass-card anim-3" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Avg AI Accuracy</span>
                <div style={{ background: 'var(--mint-bg)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--mint-border)' }}>
                  <Target style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1.1 }}>
                {avgConfidence}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--forest)', fontWeight: 700, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <ShieldCheck style={{ width: '12px', height: '12px' }} /> Dynamic Mean Score
              </div>
            </div>

            <div className="glass-card anim-4" style={{ padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Unique Species</span>
                <div style={{ background: 'var(--mint-bg)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--mint-border)' }}>
                  <Layers style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.1 }}>
                {uniqueSpecies} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>taxa</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.4rem' }}>
                Identified in Dataset
              </div>
            </div>
          </div>

          {/* ─── MAIN CHARTS ROW (DONUT & TIMELINE) ─── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem',
          }}>
            
            {/* CHART 1: Animal Class Distribution Donut */}
            <div className="glass-card anim-6" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PieChart style={{ width: '17px', height: '17px', color: 'var(--forest)' }} />
                    Animal Class Breakdown
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    Calculated dynamically from detected records
                  </p>
                </div>
              </div>

              {classData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Donut SVG */}
                  <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                    <svg width="140" height="140" viewBox="0 0 100 100">
                      {classData.map((c, i) => {
                        const strokeDash = `${(c.pct / 100) * 238} 238`;
                        let offset = 0;
                        for (let j = 0; j < i; j++) {
                          offset -= (classData[j].pct / 100) * 238;
                        }
                        return (
                          <circle
                            key={c.label}
                            cx="50" cy="50" r="38" fill="none"
                            stroke={c.color} strokeWidth="16"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={offset}
                            style={{ transition: 'all 0.6s ease' }}
                          />
                        );
                      })}
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)' }}>{totalDetections}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Logs</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, minWidth: '140px' }}>
                    {classData.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{c.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ color: 'var(--text-dark)' }}>{c.count}</strong>
                          <span className="badge-forest" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{c.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>No class data available.</p>
              )}
            </div>

            {/* CHART 2: Daily Bioacoustic Activity Curve (Bar Chart) */}
            <div className="glass-card anim-7" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Activity style={{ width: '17px', height: '17px', color: 'var(--forest)' }} />
                    Daily Log Activity
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    Prediction volume per day from database timestamps
                  </p>
                </div>
              </div>

              {/* Top Chart Area: Bars & Numbers */}
              <div style={{
                height: '110px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                gap: '0.6rem', padding: '0.5rem 0.2rem 0 0.2rem',
              }}>
                {activityData.map((item, idx) => {
                  const heightPct = item.count > 0 ? (item.count / maxActivity) * 100 : 0;

                  return (
                    <div key={idx} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
                      justifyContent: 'flex-end',
                    }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 800, color: item.count > 0 ? 'var(--forest)' : 'var(--text-muted)',
                        marginBottom: '0.3rem',
                      }}>
                        {item.count}
                      </span>

                      <div style={{
                        width: '100%', maxWidth: '24px', height: `${heightPct}%`,
                        background: 'linear-gradient(180deg, #5a9e6f 0%, #2d5a3a 100%)',
                        borderRadius: '6px 6px 0 0',
                        boxShadow: item.count > 0 ? '0 0 12px rgba(90,158,111,0.35)' : 'none',
                        transition: 'all 0.3s ease',
                      }} />
                    </div>
                  );
                })}
              </div>

              {/* Dedicated Bottom Labels Row: Always fixed on bottom line */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', gap: '0.6rem',
                paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: '0.3rem',
              }}>
                {activityData.map((item, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ─── BOTTOM ROW: CONFIDENCE BUCKETS & TOP SPECIES RANKINGS ─── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem',
          }}>
            
            {/* CHART 3: Model Confidence Distribution */}
            <div className="glass-card anim-8" style={{ padding: '1.4rem' }}>
              <div style={{ marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck style={{ width: '17px', height: '17px', color: 'var(--green)' }} />
                  Dynamic Confidence Buckets
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Real confidence score distribution from database
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {confidenceBuckets.map((b, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{b.range}</span>
                      <span style={{ fontWeight: 800, color: b.color }}>{b.count} logs ({b.pct}%)</span>
                    </div>
                    <div style={{
                      height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${b.pct}%`, height: '100%', background: b.color, borderRadius: '4px',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP SPECIES RANKINGS TABLE */}
            <div className="glass-card anim-8" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BarChart2 style={{ width: '17px', height: '17px', color: 'var(--forest)' }} />
                    Detected Species Rankings
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    Most identified species in your database
                  </p>
                </div>
              </div>

              {topSpeciesList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {topSpeciesList.map((sp, idx) => (
                    <div key={idx} className="subcard-solid" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: idx === 0 ? 'var(--forest)' : 'rgba(61,107,79,0.15)',
                          color: idx === 0 ? '#fff' : 'var(--forest)',
                          fontWeight: 800, fontSize: '0.72rem', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, lineHeight: 1.2 }}>
                            {sp.name}
                          </h5>
                          <span style={{ fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--forest)' }}>
                            {sp.scientific}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="badge-forest" style={{ fontSize: '0.65rem' }}>
                          {sp.count} logs
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                          {sp.conf}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No species detected yet.
                </p>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};
