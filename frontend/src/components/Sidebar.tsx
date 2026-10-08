import React, { useState } from 'react';
import { Radio, MapPin, History, BookOpen, BarChart2, Settings, Menu, X } from 'lucide-react';
import { LISTENLEAF_LOGO_URL } from '../assets/logoData';

interface SidebarProps {
  activeTab: 'upload' | 'location' | 'history' | 'species' | 'analytics' | 'settings';
  setActiveTab: (tab: any) => void;
  user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'upload', label: 'Identify', icon: Radio },
    { id: 'location', label: 'Animal Location', icon: MapPin },
    { id: 'history', label: 'History', icon: History },
    { id: 'species', label: 'Species Library', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ═══════ MOBILE TOP NAVBAR (Visible <= 900px) ═══════ */}
      <header className="mobile-nav-bar">
        <div
          onClick={() => setMobileOpen(!mobileOpen)}
          role="button"
          tabIndex={0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}
        >
          <img
            src={LISTENLEAF_LOGO_URL}
            alt="ListenLeaf Logo"
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 2px 8px rgba(90, 158, 111, 0.45))',
            }}
          />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
              ListenLeaf <span style={{ color: '#5a9e6f' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em' }}>
              WILDLIFE BIOACOUSTICS
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            color: '#ffffff',
            padding: '0.45rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
          }}
        >
          {mobileOpen ? <X style={{ width: '22px', height: '22px' }} /> : <Menu style={{ width: '22px', height: '22px' }} />}
        </button>
      </header>

      {/* ═══════ MOBILE DRAWER OVERLAY & DRAWER (Visible when open on mobile) ═══════ */}
      {mobileOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1.5rem', paddingBottom: '0.8rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <img
                    src={LISTENLEAF_LOGO_URL}
                    alt="ListenLeaf Logo"
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'contain',
                      mixBlendMode: 'screen',
                      filter: 'drop-shadow(0 2px 8px rgba(90, 158, 111, 0.45))',
                    }}
                  />
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      ListenLeaf
                    </span>
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em' }}>
                      AI PLATFORM
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', padding: '0.4rem', display: 'flex',
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)',
                        border: 'none', fontFamily: 'var(--font-sans)',
                        background: isActive ? 'var(--sidebar-active)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon style={{
                        width: '19px', height: '19px',
                        color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                      }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div style={{
              padding: '0.8rem 0.4rem 0.4rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Bioacoustic Intelligence</strong>
                <br />v2.0 • Wildlife Conservation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DESKTOP SIDEBAR (Visible > 900px) ═══════ */}
      <aside className="sidebar-container">
        <div>
          {/* Logo */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: '2rem', paddingTop: '0.4rem',
          }}>
            {/* ListenLeaf Stag Logo */}
            <img
              src={LISTENLEAF_LOGO_URL}
              alt="ListenLeaf Logo"
              style={{
                width: '76px',
                height: '76px',
                objectFit: 'contain',
                marginBottom: '0.6rem',
                mixBlendMode: 'screen',
                filter: 'drop-shadow(0 4px 16px rgba(90, 158, 111, 0.45))',
              }}
            />
            <span style={{
              fontSize: '1.25rem', fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              ListenLeaf
            </span>
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.1rem',
            }}>
              AI PLATFORM
            </span>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                    padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
                    border: 'none', fontFamily: 'var(--font-sans)',
                    background: isActive ? 'var(--sidebar-active)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon style={{
                    width: '17px', height: '17px',
                    color: isActive ? '#ffffff' : 'var(--sidebar-text)',
                  }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div style={{
          padding: '0.8rem 0.6rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Bioacoustic Intelligence</strong>
            <br />v2.0 • Wildlife Conservation
          </div>
        </div>
      </aside>
    </>
  );
};
