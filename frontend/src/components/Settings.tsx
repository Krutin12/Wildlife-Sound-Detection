import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TwoFactorStatus } from '../types';
import { get2faStatus, enable2fa, disable2fa, updateUserProfile } from '../api';
import {
  User, Palette, LogOut, Shield, Mail, Calendar, Check, Sparkles,
  Moon, Sun, Trees, Lock, ShieldCheck, ShieldOff, AlertCircle, CheckCircle2,
  KeyRound, Copy, Download, X, Save, Camera, Trash2, Key, Bell,
  Laptop, ChevronRight, ChevronDown, Smartphone, Eye, EyeOff
} from 'lucide-react';

interface SettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
  authToken?: string;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, onUserUpdate }) => {
  const [subTab, setSubTab] = useState<'profile' | 'appearance' | 'security'>('profile');

  // ============================================================
  // Profile Form State
  // ============================================================
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAbout, setEditAbout] = useState(
    'Wildlife bioacoustics researcher studying avian vocalizations and ecological patterns in field habitats.'
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Inline Expandable Security Sections (No Center Modals)
  const [expandedSection, setExpandedSection] = useState<'password' | 'sessions' | 'notifications' | null>(null);

  // Change Password State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Sessions State
  const [sessionsRevoked, setSessionsRevoked] = useState(false);

  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundReports, setSoundReports] = useState(true);
  const [speciesSync, setSpeciesSync] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  // ============================================================
  // Appearance & Theme State (Mobile Parity)
  // ============================================================
  const ACCENT_PALETTE = [
    { id: 'forest', name: 'Forest Emerald', hex: '#3d6b4f', darkHex: '#2d5a3a', lightHex: '#5a9e6f' },
    { id: 'sage', name: 'Sage Botanical', hex: '#6b8f71', darkHex: '#527357', lightHex: '#88ab8e' },
    { id: 'pine', name: 'Deep Pine', hex: '#2d5a3a', darkHex: '#1b3e26', lightHex: '#457a55' },
    { id: 'amber', name: 'Golden Amber', hex: '#d97706', darkHex: '#b45309', lightHex: '#f59e0b' },
  ];

  const [themeMode, setThemeMode] = useState<'forest' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('listenleaf_theme') as any) || 'forest';
  });

  const [accentHex, setAccentHex] = useState<string>(() => {
    return localStorage.getItem('listenleaf_accent') || '#3d6b4f';
  });

  const [themeToast, setThemeToast] = useState<string | null>(null);

  const handleApplyTheme = (mode: 'forest' | 'dark' | 'light') => {
    setThemeMode(mode);
    localStorage.setItem('listenleaf_theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    const names = { forest: 'Forest Glass', dark: 'Obsidian Dark', light: 'Light Botanical' };
    setThemeToast(`Switched to ${names[mode]} theme.`);
    setTimeout(() => setThemeToast(null), 2500);
  };

  const handleToggleDark = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    handleApplyTheme(nextMode);
  };

  const handleApplyAccent = (hex: string) => {
    setAccentHex(hex);
    localStorage.setItem('listenleaf_accent', hex);
    document.documentElement.style.setProperty('--forest', hex);
    const matched = ACCENT_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (matched) {
      document.documentElement.style.setProperty('--forest-dark', matched.darkHex);
      document.documentElement.style.setProperty('--forest-light', matched.lightHex);
      setThemeToast(`Accent color updated to ${matched.name}.`);
      setTimeout(() => setThemeToast(null), 2500);
    }
  };

  // ============================================================
  // 2FA State & Inline Password Prompt
  // ============================================================
  const [tfaStatus, setTfaStatus] = useState<TwoFactorStatus | null>(null);
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaError, setTfaError] = useState<string | null>(null);
  const [tfaSuccess, setTfaSuccess] = useState<string | null>(null);

  const [showInline2faPrompt, setShowInline2faPrompt] = useState(false);
  const [tfaAction, setTfaAction] = useState<'enable' | 'disable'>('enable');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [codesCopied, setCodesCopied] = useState(false);

  // Sync initial form values with user prop
  useEffect(() => {
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
      setEditDisplayName(full || 'Aarav Singh');
      setEditUsername(user.username || 'aarav_wild');
      setEditEmail(user.email || 'aarav.singh@wildsound.ai');
      setEditPhone(user.phone_number || '9876543210');
    } else {
      setEditFirstName('Aarav');
      setEditLastName('Singh');
      setEditDisplayName('Aarav Singh');
      setEditUsername('aarav_wild');
      setEditEmail('aarav.singh@wildsound.ai');
      setEditPhone('9876543210');
    }
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('Profile photo must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePhoto(reader.result as string);
        setProfileError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelForm = () => {
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
      const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
      setEditDisplayName(full || 'Aarav Singh');
      setEditUsername(user.username || 'aarav_wild');
      setEditEmail(user.email || 'aarav.singh@wildsound.ai');
      setEditPhone(user.phone_number || '9876543210');
    }
    setExpandedSection(null);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFirstName.trim() || !editLastName.trim()) {
      setProfileError('First and last name cannot be empty.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@') || !editEmail.includes('.')) {
      setProfileError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(editPhone.trim())) {
      setProfileError('Phone number must be exactly 10 digits.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    try {
      if (user) {
        const updated = await updateUserProfile(user.id, {
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone_number: editPhone.trim(),
        });
        if (onUserUpdate) {
          onUserUpdate(updated);
        }
      }
      setProfileSuccess('Account profile updated successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (!currentPwd) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (newPwd.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('New password confirmation does not match.');
      return;
    }
    setPwdLoading(true);
    setTimeout(() => {
      setPwdLoading(false);
      setPwdSuccess('Password updated successfully!');
      setTimeout(() => {
        setExpandedSection(null);
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdSuccess(null);
      }, 1400);
    }, 800);
  };

  // Load 2FA status
  const load2faStatus = async () => {
    if (!user) return;
    setTfaLoading(true);
    try {
      const status = await get2faStatus(user.id);
      setTfaStatus(status);
    } catch {
      setTfaStatus({ enabled: false });
    } finally {
      setTfaLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'security') {
      load2faStatus();
    }
  }, [subTab, user]);

  const handlePasswordConfirm = async () => {
    if (!user || !confirmPassword) {
      setPasswordError('Please enter your password.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      if (tfaAction === 'enable') {
        const res = await enable2fa(user.id, 'email', confirmPassword);
        setRecoveryCodes(res.codes);
        setTfaSuccess(res.message);
      } else if (tfaAction === 'disable') {
        const res = await disable2fa(user.id, confirmPassword);
        setTfaSuccess(res.message);
        setRecoveryCodes(null);
      }
      setShowInline2faPrompt(false);
      setConfirmPassword('');
      await load2faStatus();
    } catch (err: any) {
      setPasswordError(err.message || 'Operation failed.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  };

  const downloadRecoveryCodes = () => {
    if (!recoveryCodes) return;
    const content = `ListenLeaf AI — Recovery Codes\n${'='.repeat(40)}\nSave these codes securely. Each code can only be used once.\n\n${recoveryCodes.join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'listenleaf-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials = (editFirstName ? editFirstName[0] : 'A') + (editLastName ? editLastName[0] : 'S');

  return (
    <div className="glass-card anim-2" style={{ padding: '1.8rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Account & System Settings
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
          Manage your personal profile, appearance settings, and session security.
        </p>
      </div>

      <div className="settings-layout-grid">
        {/* Left Sub-Navigation Menu */}
        <div className="settings-nav-card" style={{
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
          padding: '0.6rem', borderRadius: 'var(--radius-lg)',
        }}>
          <button
            onClick={() => setSubTab('profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: 'none', fontFamily: 'var(--font-sans)',
              background: subTab === 'profile' ? 'var(--forest)' : 'transparent',
              color: subTab === 'profile' ? '#ffffff' : 'var(--text-dark)',
              fontWeight: subTab === 'profile' ? 700 : 500,
              fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <User style={{ width: '17px', height: '17px' }} />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setSubTab('appearance')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: 'none', fontFamily: 'var(--font-sans)',
              background: subTab === 'appearance' ? 'var(--forest)' : 'transparent',
              color: subTab === 'appearance' ? '#ffffff' : 'var(--text-dark)',
              fontWeight: subTab === 'appearance' ? 700 : 500,
              fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <Palette style={{ width: '17px', height: '17px' }} />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setSubTab('security')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: 'none', fontFamily: 'var(--font-sans)',
              background: subTab === 'security' ? 'var(--forest)' : 'transparent',
              color: subTab === 'security' ? '#ffffff' : 'var(--text-dark)',
              fontWeight: subTab === 'security' ? 700 : 500,
              fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield style={{ width: '17px', height: '17px' }} />
            <span>Security</span>
          </button>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0.3rem 0' }} />

          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(220,38,38,0.2)', fontFamily: 'var(--font-sans)',
              background: 'rgba(220,38,38,0.06)', color: 'var(--rose)',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220,38,38,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}
          >
            <LogOut style={{ width: '17px', height: '17px' }} />
            <span>Log Out</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div>
          {/* ============================================================
              PROFILE SUB-TAB (Modern Redesigned Account Profile Form)
              ============================================================ */}
          {subTab === 'profile' && (
            <div className="profile-editor-card">
              {/* Alerts */}
              {profileSuccess && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.2rem',
                  color: 'var(--green)', fontSize: '0.82rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  animation: 'fadeInUp 0.3s ease-out',
                }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div style={{
                  background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.2rem',
                  color: 'var(--rose)', fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  animation: 'fadeInUp 0.3s ease-out',
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                {/* 1. Profile Photo Section */}
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-circle">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile Avatar" />
                    ) : (
                      <span>{initials.toUpperCase()}</span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />

                  <div className="profile-avatar-actions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="profile-avatar-btn-change"
                    >
                      <Camera style={{ width: '13px', height: '13px' }} />
                      <span>Change Photo</span>
                    </button>

                    {profilePhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="profile-avatar-btn-remove"
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    JPG, PNG or WEBP (Max 2MB)
                  </span>
                </div>

                {/* 2. Form Fields Layout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* First Name & Last Name Side-by-Side */}
                  <div className="settings-detail-grid">
                    <div className="profile-field-group">
                      <label className="profile-field-label">First Name *</label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="profile-field-input"
                        required
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label">Last Name *</label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="profile-field-input"
                        required
                      />
                    </div>
                  </div>

                  {/* Display Name (Full Width) */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">Display Name</label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="profile-field-input"
                    />
                  </div>

                  {/* Username (Full Width) */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Enter username"
                      className="profile-field-input"
                    />
                  </div>

                  {/* Email Address (Full Width) */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">Email Address *</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="profile-field-input"
                      required
                    />
                  </div>

                  {/* 10-Digit Phone Number (Full Width) */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">10-Digit Phone Number *</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit phone number"
                      className="profile-field-input"
                      required
                    />
                  </div>

                  {/* About Me Multiline Textarea */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">About Me</label>
                    <textarea
                      value={editAbout}
                      maxLength={240}
                      rows={3}
                      onChange={(e) => setEditAbout(e.target.value)}
                      placeholder="Tell us something about yourself..."
                      className="profile-textarea"
                    />
                    <div className="profile-char-counter">
                      {editAbout.length}/240
                    </div>
                  </div>
                </div>

                {/* 3. Account & Security Section (Inline Expandables) */}
                <div className="profile-security-section">
                  <div className="profile-security-title">
                    <Shield style={{ width: '18px', height: '18px', color: 'var(--forest)' }} />
                    <span>Account & Security</span>
                  </div>
                  <p className="profile-security-subtitle">
                    Manage login credentials, two-factor authentication, and notifications.
                  </p>

                  <div className="profile-security-list">
                    {/* Row 1: Change Password (Inline Accordion) */}
                    <div>
                      <div
                        className="profile-security-row"
                        onClick={() => setExpandedSection(expandedSection === 'password' ? null : 'password')}
                      >
                        <div className="profile-security-row-left">
                          <div className="profile-security-icon-box">
                            <Key style={{ width: '18px', height: '18px' }} />
                          </div>
                          <div>
                            <div className="profile-security-row-label">Change Password</div>
                            <div className="profile-security-row-desc">
                              Update your master password for enhanced account security
                            </div>
                          </div>
                        </div>
                        {expandedSection === 'password' ? (
                          <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                        ) : (
                          <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      {/* Inline Expanded Panel for Change Password */}
                      {expandedSection === 'password' && (
                        <div className="inline-expandable-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                              Update Master Password
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedSection(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              <X style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>

                          {pwdSuccess && (
                            <div style={{
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: 'var(--radius-md)', padding: '0.55rem 0.8rem', marginBottom: '0.8rem',
                              color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                              <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                              <span>{pwdSuccess}</span>
                            </div>
                          )}

                          {pwdError && (
                            <div style={{
                              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                              borderRadius: 'var(--radius-md)', padding: '0.55rem 0.8rem', marginBottom: '0.8rem',
                              color: 'var(--rose)', fontSize: '0.8rem', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                              <AlertCircle style={{ width: '14px', height: '14px' }} />
                              <span>{pwdError}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="profile-field-group">
                              <label className="profile-field-label">Current Password</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showCurrentPwd ? 'text' : 'password'}
                                  value={currentPwd}
                                  onChange={(e) => setCurrentPwd(e.target.value)}
                                  placeholder="Enter current password"
                                  className="profile-field-input"
                                  style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                  style={{
                                    position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                  }}
                                >
                                  {showCurrentPwd ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                                </button>
                              </div>
                            </div>

                            <div className="profile-field-group">
                              <label className="profile-field-label">New Password (min 6 chars)</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showNewPwd ? 'text' : 'password'}
                                  value={newPwd}
                                  onChange={(e) => setNewPwd(e.target.value)}
                                  placeholder="Enter new password"
                                  className="profile-field-input"
                                  style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPwd(!showNewPwd)}
                                  style={{
                                    position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                  }}
                                >
                                  {showNewPwd ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                                </button>
                              </div>
                            </div>

                            <div className="profile-field-group">
                              <label className="profile-field-label">Confirm New Password</label>
                              <input
                                type="password"
                                value={confirmPwd}
                                onChange={(e) => setConfirmPwd(e.target.value)}
                                placeholder="Re-enter new password"
                                className="profile-field-input"
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => setExpandedSection(null)}
                                className="btn-outline"
                                style={{ flex: 1, padding: '0.55rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleChangePasswordSubmit}
                                disabled={pwdLoading}
                                className="btn-forest"
                                style={{ flex: 1, padding: '0.55rem' }}
                              >
                                {pwdLoading ? (
                                  <><Sparkles style={{ width: '14px', height: '14px' }} className="loading-spinner" /> Updating...</>
                                ) : (
                                  'Update Password'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Two-Factor Authentication */}
                    <div
                      className="profile-security-row"
                      onClick={() => setSubTab('security')}
                    >
                      <div className="profile-security-row-left">
                        <div className="profile-security-icon-box">
                          <ShieldCheck style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div>
                          <div className="profile-security-row-label">Two-Factor Authentication</div>
                          <div className="profile-security-row-desc">
                            Manage 2FA verification codes via email OTP
                          </div>
                        </div>
                      </div>
                      <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                    </div>

                    {/* Row 3: Login Sessions (Inline Accordion) */}
                    <div>
                      <div
                        className="profile-security-row"
                        onClick={() => setExpandedSection(expandedSection === 'sessions' ? null : 'sessions')}
                      >
                        <div className="profile-security-row-left">
                          <div className="profile-security-icon-box">
                            <Laptop style={{ width: '18px', height: '18px' }} />
                          </div>
                          <div>
                            <div className="profile-security-row-label">Login Sessions</div>
                            <div className="profile-security-row-desc">
                              View and revoke active device & browser sessions
                            </div>
                          </div>
                        </div>
                        {expandedSection === 'sessions' ? (
                          <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                        ) : (
                          <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      {/* Inline Expanded Panel for Sessions */}
                      {expandedSection === 'sessions' && (
                        <div className="inline-expandable-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                              Active Authenticated Sessions
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedSection(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              <X style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.9rem' }}>
                            {/* Session 1 */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.7rem 0.85rem', background: 'rgba(61, 107, 79, 0.08)',
                              border: '1px solid var(--mint-border)', borderRadius: 'var(--radius-md)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <Laptop style={{ width: '18px', height: '18px', color: 'var(--forest)' }} />
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                    Web Browser / Desktop
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--forest)', fontWeight: 600 }}>
                                    Current session • IP 127.0.0.1
                                  </div>
                                </div>
                              </div>
                              <span className="badge-forest" style={{ fontSize: '0.62rem' }}>Active</span>
                            </div>

                            {/* Session 2 */}
                            {!sessionsRevoked && (
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.7rem 0.85rem', background: 'rgba(0,0,0,0.02)',
                                border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <Smartphone style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
                                  <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                      Mobile Client / Android & iOS
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      Last active 3 hours ago
                                    </div>
                                  </div>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Idle</span>
                              </div>
                            )}
                          </div>

                          {!sessionsRevoked ? (
                            <button
                              type="button"
                              onClick={() => setSessionsRevoked(true)}
                              className="btn-outline"
                              style={{ color: 'var(--rose)', borderColor: 'rgba(220,38,38,0.25)', width: '100%', justifyContent: 'center' }}
                            >
                              <LogOut style={{ width: '14px', height: '14px' }} /> Terminate Other Sessions
                            </button>
                          ) : (
                            <div style={{
                              padding: '0.5rem', textAlign: 'center', fontSize: '0.76rem',
                              color: 'var(--green)', fontWeight: 700, background: 'rgba(34,197,94,0.1)',
                              borderRadius: 'var(--radius-md)',
                            }}>
                              All other sessions terminated.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Row 4: Notification Preferences (Inline Accordion) */}
                    <div>
                      <div
                        className="profile-security-row"
                        onClick={() => setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')}
                      >
                        <div className="profile-security-row-left">
                          <div className="profile-security-icon-box">
                            <Bell style={{ width: '18px', height: '18px' }} />
                          </div>
                          <div>
                            <div className="profile-security-row-label">Notification Preferences</div>
                            <div className="profile-security-row-desc">
                              Customize email alerts, bioacoustic exports & sync updates
                            </div>
                          </div>
                        </div>
                        {expandedSection === 'notifications' ? (
                          <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                        ) : (
                          <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                        )}
                      </div>

                      {/* Inline Expanded Panel for Notifications */}
                      {expandedSection === 'notifications' && (
                        <div className="inline-expandable-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                              Notification Preferences
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedSection(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                              <X style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>

                          {notifSuccess && (
                            <div style={{
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                              borderRadius: 'var(--radius-md)', padding: '0.55rem 0.8rem', marginBottom: '0.8rem',
                              color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                              <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                              <span>{notifSuccess}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            <label className="notif-item-card" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.7rem 0.85rem',
                              border: '1px solid var(--mint-border)', borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  Email Classification Alerts
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Receive digest for newly identified species
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailAlerts}
                                onChange={(e) => setEmailAlerts(e.target.checked)}
                                style={{ width: '17px', height: '17px', accentColor: 'var(--forest)' }}
                              />
                            </label>

                            <label className="notif-item-card" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.7rem 0.85rem',
                              border: '1px solid var(--mint-border)', borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  Bioacoustic Report Exports
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Weekly audio analysis summaries
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={soundReports}
                                onChange={(e) => setSoundReports(e.target.checked)}
                                style={{ width: '17px', height: '17px', accentColor: 'var(--forest)' }}
                              />
                            </label>

                            <label className="notif-item-card" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.7rem 0.85rem',
                              border: '1px solid var(--mint-border)', borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                                  Database Synchronizations
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Offline species library sync notices
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={speciesSync}
                                onChange={(e) => setSpeciesSync(e.target.checked)}
                                style={{ width: '17px', height: '17px', accentColor: 'var(--forest)' }}
                              />
                            </label>
                          </div>

                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedSection(null)}
                              className="btn-outline"
                              style={{ flex: 1, padding: '0.55rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setNotifSuccess('Notification preferences saved!');
                                setTimeout(() => {
                                  setNotifSuccess(null);
                                }, 2000);
                              }}
                              className="btn-forest"
                              style={{ flex: 1, padding: '0.55rem' }}
                            >
                              Save Preferences
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Form Footer Actions */}
                <div className="profile-form-footer">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    disabled={profileLoading}
                    className="btn-outline"
                    style={{ padding: '0.65rem 1.3rem' }}
                  >
                    <X style={{ width: '15px', height: '15px' }} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="btn-forest"
                    style={{ width: 'auto', padding: '0.65rem 1.6rem' }}
                  >
                    {profileLoading ? (
                      <><Sparkles style={{ width: '15px', height: '15px' }} className="loading-spinner" /> Saving...</>
                    ) : (
                      <><Save style={{ width: '15px', height: '15px' }} /> Save Profile</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================
              APPEARANCE SUB-TAB (Mobile Parity Experience)
              ============================================================ */}
          {subTab === 'appearance' && (
            <div className="appearance-card anim-2">
              <div style={{ marginBottom: '1.3rem' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                  Appearance & Theme Preferences
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Customize dark mode, primary accent tones, and nature interface styles matching the mobile app.
                </p>
              </div>

              {themeToast && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '0.6rem 0.85rem', marginBottom: '1.1rem',
                  color: 'var(--green)', fontSize: '0.82rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  animation: 'fadeInUp 0.25s ease-out',
                }}>
                  <CheckCircle2 style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  <span>{themeToast}</span>
                </div>
              )}

              {/* 1. Obsidian Dark Mode Switch List Tile */}
              <div className="appearance-tile">
                <div className="appearance-tile-left">
                  <div className="appearance-tile-icon">
                    {themeMode === 'dark' ? (
                      <Moon style={{ width: '20px', height: '20px' }} />
                    ) : (
                      <Sun style={{ width: '20px', height: '20px' }} />
                    )}
                  </div>
                  <div>
                    <div className="appearance-tile-title">Obsidian Dark Mode</div>
                    <div className="appearance-tile-sub">
                      {themeMode === 'dark' ? 'Luxury dark forest theme active' : 'Light botanical theme active'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleDark}
                  className={`theme-switch-toggle ${themeMode === 'dark' ? 'active' : ''}`}
                  aria-label="Toggle Obsidian Dark Mode"
                >
                  <div className="theme-switch-thumb" />
                </button>
              </div>

              {/* 2. Primary Accent Theme Tile & Swatches */}
              <div className="appearance-tile">
                <div className="appearance-tile-left">
                  <div className="appearance-tile-icon">
                    <Palette style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div>
                    <div className="appearance-tile-title">Primary Accent Theme</div>
                    <div className="appearance-tile-sub">
                      {ACCENT_PALETTE.find(c => c.hex.toLowerCase() === accentHex.toLowerCase())?.name || 'Forest Emerald'} ({accentHex.toUpperCase()})
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="swatch-group">
                  {ACCENT_PALETTE.map((swatch) => {
                    const isSelected = swatch.hex.toLowerCase() === accentHex.toLowerCase();
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleApplyAccent(swatch.hex)}
                        title={swatch.name}
                        className={`color-swatch-item ${isSelected ? 'active' : ''}`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelected && (
                          <Check style={{ width: '15px', height: '15px', color: '#ffffff', strokeWidth: 3 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Interactive Theme Presets */}
              <div style={{ marginTop: '1.4rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '0.3rem' }}>
                  Interface Theme Presets
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
                  Select from pre-configured botanical styles with curated contrasts and glassmorphism.
                </p>

                <div className="theme-preset-grid">
                  {/* Preset 1: Forest Glass */}
                  <div
                    onClick={() => handleApplyTheme('forest')}
                    className={`theme-preset-card ${themeMode === 'forest' ? 'active' : ''}`}
                  >
                    <Trees style={{ width: '28px', height: '28px', color: themeMode === 'forest' ? 'var(--forest)' : 'var(--text-muted)' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Forest Glass</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: themeMode === 'forest' ? 'var(--forest)' : 'var(--text-muted)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: themeMode === 'forest' ? 'rgba(61,107,79,0.15)' : 'rgba(0,0,0,0.04)',
                    }}>
                      {themeMode === 'forest' ? '✓ Active Theme' : 'Standard Nature'}
                    </div>
                  </div>

                  {/* Preset 2: Obsidian Dark */}
                  <div
                    onClick={() => handleApplyTheme('dark')}
                    className={`theme-preset-card ${themeMode === 'dark' ? 'active' : ''}`}
                  >
                    <Moon style={{ width: '28px', height: '28px', color: themeMode === 'dark' ? 'var(--forest)' : 'var(--text-muted)' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Obsidian Dark</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: themeMode === 'dark' ? 'var(--forest)' : 'var(--text-muted)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: themeMode === 'dark' ? 'rgba(61,107,79,0.25)' : 'rgba(0,0,0,0.04)',
                    }}>
                      {themeMode === 'dark' ? '✓ Active Theme' : 'Dark Luxury'}
                    </div>
                  </div>

                  {/* Preset 3: Light Botanical */}
                  <div
                    onClick={() => handleApplyTheme('light')}
                    className={`theme-preset-card ${themeMode === 'light' ? 'active' : ''}`}
                  >
                    <Sun style={{ width: '28px', height: '28px', color: themeMode === 'light' ? 'var(--forest)' : 'var(--text-muted)' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Light Botanical</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: themeMode === 'light' ? 'var(--forest)' : 'var(--text-muted)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: themeMode === 'light' ? 'rgba(61,107,79,0.15)' : 'rgba(0,0,0,0.04)',
                    }}>
                      {themeMode === 'light' ? '✓ Active Theme' : 'Daylight Mode'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              SECURITY SUB-TAB — Two-Factor Authentication (Inline Flow)
              ============================================================ */}
          {subTab === 'security' && (
            <div className="settings-subtab-card" style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--mint-border)',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <Shield style={{ width: '22px', height: '22px', color: 'var(--forest)' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                  Two-Factor Authentication
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                Add an extra layer of security to your account by requiring a verification code during login.
              </p>

              {/* Success Message */}
              {tfaSuccess && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1rem',
                  color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  animation: 'fadeInUp 0.3s ease-out',
                }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{tfaSuccess}</span>
                </div>
              )}

              {/* Error Message */}
              {tfaError && (
                <div style={{
                  background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1rem',
                  color: 'var(--rose)', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  <span>{tfaError}</span>
                </div>
              )}

              {tfaLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Sparkles style={{ width: '20px', height: '20px' }} className="loading-spinner" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading security settings...</p>
                </div>
              ) : (
                <>
                  {/* 2FA Status Card */}
                  <div className="settings-2fa-card" style={{
                    borderRadius: 'var(--radius-md)', padding: '1.2rem',
                    marginBottom: '1.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: tfaStatus?.enabled
                          ? 'linear-gradient(135deg, #2d8a4e, #34d399)'
                          : 'rgba(0,0,0,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {tfaStatus?.enabled ? (
                          <ShieldCheck style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                        ) : (
                          <ShieldOff style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                          {tfaStatus?.enabled ? 'Email 2FA is Enabled' : 'Email 2FA is Disabled'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {tfaStatus?.enabled
                            ? `Verification codes sent to ${tfaStatus.masked_email || user?.email}`
                            : 'Require a 6-digit OTP sent to your email on every login'
                          }
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTfaAction(tfaStatus?.enabled ? 'disable' : 'enable');
                        setShowInline2faPrompt(true);
                        setConfirmPassword('');
                        setPasswordError(null);
                      }}
                      className={tfaStatus?.enabled ? 'btn-outline' : 'btn-forest'}
                      style={{
                        padding: '0.5rem 1.1rem',
                        fontSize: '0.82rem',
                        width: 'auto',
                        ...(tfaStatus?.enabled ? {
                          color: 'var(--rose)', borderColor: 'rgba(220,38,38,0.25)',
                        } : {}),
                      }}
                    >
                      {tfaStatus?.enabled ? (
                        <><ShieldOff style={{ width: '14px', height: '14px' }} /> Disable</>
                      ) : (
                        <><ShieldCheck style={{ width: '14px', height: '14px' }} /> Enable Email 2FA</>
                      )}
                    </button>
                  </div>

                  {/* Inline Password Confirmation Form for 2FA */}
                  {showInline2faPrompt && (
                    <div className="inline-expandable-card" style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Lock style={{ width: '16px', height: '16px', color: 'var(--forest)' }} />
                          <span>{tfaAction === 'enable' ? 'Confirm 2FA Activation' : 'Confirm 2FA Deactivation'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInline2faPrompt(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <X style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                        Enter your account password to confirm this security change.
                      </p>

                      {passwordError && (
                        <div style={{
                          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                          borderRadius: 'var(--radius-md)', padding: '0.5rem 0.7rem', marginBottom: '0.8rem',
                          color: 'var(--rose)', fontSize: '0.78rem', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                          <AlertCircle style={{ width: '14px', height: '14px' }} />
                          <span>{passwordError}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="password"
                          placeholder="Enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordConfirm(); }}
                          className="profile-field-input"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handlePasswordConfirm}
                          disabled={passwordLoading || !confirmPassword}
                          className="btn-forest"
                          style={{
                            width: 'auto', padding: '0.5rem 1.2rem',
                            ...(tfaAction === 'disable' ? {
                              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            } : {}),
                          }}
                        >
                          {passwordLoading ? (
                            <><Sparkles style={{ width: '14px', height: '14px' }} className="loading-spinner" /> Processing...</>
                          ) : (
                            'Confirm'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Destination Info Box */}
                  <div className="settings-info-card" style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--mint-border)',
                    marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(61,107,79,0.15)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--forest)',
                    }}>
                      <Mail style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Linked Email Address
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {user?.email || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Recovery Codes Display */}
                  {recoveryCodes && (
                    <div style={{
                      background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: 'var(--radius-md)', padding: '1.2rem', marginBottom: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <KeyRound style={{ width: '16px', height: '16px', color: 'var(--blue)' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)' }}>Recovery Codes</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
                        Save these codes in a secure location. Each code can only be used once to regain access if you lose your verification device.
                      </p>

                      <div className="settings-recovery-box" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.8rem', marginBottom: '0.8rem',
                        border: '1px solid var(--mint-border)',
                        fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 600,
                        color: 'var(--text-dark)',
                      }}>
                        {recoveryCodes.map((code, i) => (
                          <div key={i} style={{ padding: '0.25rem 0.4rem' }}>{code}</div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button onClick={copyRecoveryCodes} className="btn-outline" style={{ flex: 1 }}>
                          {codesCopied ? (
                            <><Check style={{ width: '14px', height: '14px' }} /> Copied!</>
                          ) : (
                            <><Copy style={{ width: '14px', height: '14px' }} /> Copy Codes</>
                          )}
                        </button>
                        <button onClick={downloadRecoveryCodes} className="btn-outline" style={{ flex: 1 }}>
                          <Download style={{ width: '14px', height: '14px' }} /> Download
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
