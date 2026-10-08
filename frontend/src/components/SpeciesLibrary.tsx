import React, { useState, useEffect } from 'react';
import { SpeciesRecord } from '../types';
import { Leaf, Search, Trees, ShieldCheck, Utensils, Feather, Globe, ExternalLink, Sparkles, X } from 'lucide-react';
import { searchWikipediaSpecies, WikiResult } from '../api/wikipedia';

interface SpeciesLibraryProps {
  speciesList: SpeciesRecord[];
  loading: boolean;
}

export const SpeciesLibrary: React.FC<SpeciesLibraryProps> = ({ speciesList, loading }) => {
  const [query, setQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<WikiResult[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [selectedWiki, setSelectedWiki] = useState<WikiResult | null>(null);

  // Filter local database records
  const filteredLocal = speciesList.filter(
    (s) =>
      s.common_name.toLowerCase().includes(query.toLowerCase()) ||
      s.scientific_name.toLowerCase().includes(query.toLowerCase()) ||
      s.primary_label.toLowerCase().includes(query.toLowerCase())
  );

  // Debounced Wikipedia Live Search
  useEffect(() => {
    if (!query.trim()) {
      setWikiResults([]);
      setWikiLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setWikiLoading(true);
      const results = await searchWikipediaSpecies(query);
      setWikiResults(results);
      setWikiLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

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
            <Trees style={{ width: '21px', height: '21px', color: 'var(--forest)' }} />
            Species Library & Knowledge Base
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
            Taxonomic profiles from local database and live global Wikipedia intelligence.
          </p>
        </div>

        <div className="badge-forest" style={{ padding: '0.35rem 0.75rem' }}>
          <Globe style={{ width: '13px', height: '13px', color: 'var(--forest)' }} /> Live Wikipedia Integration
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search any species e.g. kingfisher, bananaquit, lion, eagle..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-glass"
        />
        <Search style={{
          width: '17px', height: '17px', color: 'var(--text-muted)',
          position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
        }} />
        {wikiLoading && (
          <div style={{
            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--forest)',
          }}>
            <Sparkles style={{ width: '14px', height: '14px' }} className="loading-spinner" />
            <span>Fetching Wikipedia...</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Feather className="loading-spinner" style={{ width: '32px', height: '32px', margin: '0 auto 0.8rem auto', color: 'var(--forest)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading species metadata...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          
          {/* Section 1: Local Database Results */}
          {filteredLocal.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Leaf style={{ width: '15px', height: '15px', color: 'var(--forest)' }} />
                Database Verified Species ({filteredLocal.length})
              </h3>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
              }}>
                {filteredLocal.map((s) => (
                  <div key={s.primary_label} className="glass-card-interactive" style={{ padding: '1.2rem' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '0.7rem',
                    }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                          {s.common_name}
                        </h4>
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--forest)' }}>
                          {s.scientific_name}
                        </span>
                      </div>
                      <span className="badge-forest" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                        {s.primary_label}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.78rem', color: 'var(--text-muted)',
                      display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Trees style={{ width: '13px', height: '13px', color: 'var(--forest)', flexShrink: 0 }} />
                        <span><strong style={{ color: 'var(--text-secondary)' }}>Habitat:</strong> {s.habitat || 'Various'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Utensils style={{ width: '13px', height: '13px', color: 'var(--amber)', flexShrink: 0 }} />
                        <span><strong style={{ color: 'var(--text-secondary)' }}>Diet:</strong> {s.diet || 'Varies'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck style={{ width: '13px', height: '13px', color: 'var(--green)', flexShrink: 0 }} />
                        <span><strong style={{ color: 'var(--text-secondary)' }}>Status:</strong> {s.conservation_status || 'Least Concern'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Live Wikipedia Intelligence Results */}
          {query.trim().length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe style={{ width: '15px', height: '15px', color: '#0284c7' }} />
                  Wikipedia Species Articles ({wikiResults.length})
                </h3>
              </div>

              {/* Inline Expanded Article Detail Spotlight (No Center Popup) */}
              {selectedWiki && (
                <div className="inline-expandable-card" style={{ marginBottom: '1.2rem', padding: '1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span className="badge-forest" style={{ marginBottom: '0.35rem', fontSize: '0.68rem' }}>
                        <Globe style={{ width: '11px', height: '11px' }} /> Wikipedia Global Knowledge
                      </span>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.15rem 0' }}>
                        {selectedWiki.title}
                      </h3>
                      {selectedWiki.description && (
                        <p style={{ fontStyle: 'italic', color: '#0284c7', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                          {selectedWiki.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedWiki(null)}
                      style={{
                        background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
                        color: 'var(--text-muted)', width: '30px', height: '30px', borderRadius: '8px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X style={{ width: '15px', height: '15px' }} />
                    </button>
                  </div>

                  {selectedWiki.thumbnail && (
                    <div style={{
                      width: '100%', height: '200px', borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden', marginBottom: '1rem', background: '#000',
                    }}>
                      <img
                        src={selectedWiki.thumbnail.source}
                        alt={selectedWiki.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{
                    background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(0,0,0,0.06)', marginBottom: '1rem',
                    fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6,
                  }}>
                    {selectedWiki.extract}
                  </div>

                  {selectedWiki.content_urls?.desktop?.page && (
                    <a
                      href={selectedWiki.content_urls.desktop.page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-forest"
                      style={{ textDecoration: 'none', textAlign: 'center', width: 'auto', display: 'inline-flex' }}
                    >
                      <ExternalLink style={{ width: '15px', height: '15px' }} />
                      Open Full Article on Wikipedia.org
                    </a>
                  )}
                </div>
              )}

              {wikiLoading ? (
                <div className="subcard-solid" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                  <Sparkles className="loading-spinner" style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem auto', color: '#0284c7' }} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fetching live Wikipedia articles for "{query}"...</p>
                </div>
              ) : wikiResults.length > 0 ? (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1rem',
                }}>
                  {wikiResults.map((wiki, idx) => (
                    <div
                      key={wiki.title + idx}
                      className="wiki-item-solid"
                      onClick={() => setSelectedWiki(wiki)}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        border: selectedWiki?.title === wiki.title ? '2px solid var(--forest)' : undefined,
                      }}
                    >
                      <div>
                        {/* Thumbnail Image */}
                        {wiki.thumbnail ? (
                          <div style={{
                            width: '100%', height: '140px', borderRadius: 'var(--radius-md)',
                            overflow: 'hidden', marginBottom: '0.8rem', background: '#000',
                          }}>
                            <img
                              src={wiki.thumbnail.source}
                              alt={wiki.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            width: '100%', height: '80px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(2, 132, 199, 0.08)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem',
                            color: '#0284c7',
                          }}>
                            <Globe style={{ width: '28px', height: '28px', opacity: 0.5 }} />
                          </div>
                        )}

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                          {wiki.title}
                        </h4>
                        {wiki.description && (
                          <p style={{
                            fontSize: '0.78rem', color: '#0284c7', fontWeight: 600,
                            fontStyle: 'italic', margin: '0.2rem 0 0.5rem 0',
                          }}>
                            {wiki.description}
                          </p>
                        )}
                        <p style={{
                          fontSize: '0.78rem', color: 'var(--text-secondary)',
                          lineHeight: 1.45, margin: '0.4rem 0 0 0',
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {wiki.extract}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWiki(wiki);
                        }}
                        className="btn-outline"
                        style={{
                          width: '100%', marginTop: '0.9rem', fontSize: '0.76rem',
                          justifyContent: 'center', color: '#0284c7', borderColor: 'rgba(2,132,199,0.3)',
                        }}
                      >
                        <ExternalLink style={{ width: '12px', height: '12px' }} />
                        {selectedWiki?.title === wiki.title ? 'Viewing Article' : 'Read Article'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="subcard-solid" style={{
                  padding: '2.5rem 1.5rem', textAlign: 'center',
                  borderRadius: 'var(--radius-xl)',
                }}>
                  <Globe style={{ width: '36px', height: '36px', opacity: 0.25, margin: '0 auto 0.6rem auto', color: '#0284c7' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    No Wikipedia Articles Found
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Try searching with another keyword e.g. "owl", "falcon", "canis", "python".
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state when query is empty and no local records */}
          {query.trim().length === 0 && filteredLocal.length === 0 && (
            <div className="subcard-solid" style={{
              padding: '3.5rem 2rem', textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
            }}>
              <Feather style={{ width: '42px', height: '42px', opacity: 0.2, margin: '0 auto 0.8rem auto', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>No species found in database.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
