import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, isLoginResponse } from '../types';
import { registerUser, loginUser, checkUsernameAvailability, checkEmailAvailability, verifyOtp, resendOtp } from '../api';
import { ShieldCheck, Lock, User, Mail, Phone, AlertCircle, CheckCircle2, UserPlus, LogIn, Sparkles, Check, X, KeyRound, ArrowLeft } from 'lucide-react';
import { LISTENLEAF_LOGO_URL } from '../assets/logoData';

interface AuthModalProps {
  onSuccess: (user: UserProfile, token: string) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose }) => {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Splash Screen Intro Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => {
        setShowSplash(false);
      }, 500);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up Extra Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Real-time username & email availability state
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Validation helpers for Password Complexity & Phone Number
  const isPhoneValid = /^\d{10}$/.test(phoneNumber.trim());
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSymbol;

  // ============================================================
  // 2FA OTP Verification State
  // ============================================================
  const [show2FA, setShow2FA] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [otpMethod, setOtpMethod] = useState('');
  const [maskedDest, setMaskedDest] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset errors on view switch
  const toggleView = (targetSignUp: boolean) => {
    setError(null);
    setSuccessMessage(null);
    setIsSignUp(targetSignUp);
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setUsernameTaken(false);
    setEmailTaken(false);
  };

  // Username availability check debounced
  useEffect(() => {
    if (!isSignUp || !username.trim() || username.length < 3) {
      setUsernameTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await checkUsernameAvailability(username);
        setUsernameTaken(res.exists);
      } catch {
        setUsernameTaken(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [username, isSignUp]);

  // Email availability check debounced
  useEffect(() => {
    if (!isSignUp || !email.trim() || !email.includes('@')) {
      setEmailTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await checkEmailAvailability(email);
        setEmailTaken(res.exists);
      } catch {
        setEmailTaken(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [email, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      // Validate Sign Up fields
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password || !phoneNumber.trim()) {
        setError('Please fill in all required fields.');
        return;
      }

      // Check 10-digit phone number requirement
      if (!isPhoneValid) {
        setError('Phone number must be exactly 10 digits.');
        return;
      }

      // Check Password complexity requirement
      if (!isPasswordValid) {
        setError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and symbol (@, #, _, etc.).');
        return;
      }

      // Check Password match
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter the same password.');
        return;
      }

      // Check Email availability
      if (emailTaken) {
        setError('Email address already registered. Please use a different email or log in.');
        return;
      }

      // Check Username availability
      if (usernameTaken) {
        setError('Username already taken. Please choose a different username.');
        return;
      }

      setLoading(true);
      try {
        const regUsername = username.trim();
        await registerUser({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          username: regUsername,
          password,
          phone_number: phoneNumber.trim(),
        });
        
        // Redirect to Login page instead of logging in automatically
        setSuccessMessage('Account created successfully! Please log in with your credentials.');
        setIsSignUp(false);
        setUsername(regUsername);
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhoneNumber('');
        setUsernameTaken(false);
        setEmailTaken(false);
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // Validate Login fields
      if (!username.trim() || !password) {
        setError('Please enter your username and password.');
        return;
      }

      setLoading(true);
      try {
        const res = await loginUser({ username: username.trim(), password });
        if (isLoginResponse(res)) {
          // 2FA required — show OTP verification
          setChallengeId(res.challenge_id);
          setOtpMethod(res.method);
          setMaskedDest(res.masked_destination);
          setOtpDigits(['', '', '', '', '', '']);
          setOtpError(null);
          setResendCooldown(30);
          setShow2FA(true);
        } else {
          onSuccess(res.user, res.token);
        }
      } catch (err: any) {
        setError(err.message || 'Invalid username or password.');
      } finally {
        setLoading(false);
      }
    }
  };

  // ============================================================
  // OTP Input Handlers
  // ============================================================
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await verifyOtp(challengeId, code);
      onSuccess(res.user, res.token);
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed.');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await resendOtp(challengeId);
      setMaskedDest(res.masked_destination);
      setResendCooldown(30);
      setOtpError(null);
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend OTP.');
    }
  };

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP input when 2FA view opens
  useEffect(() => {
    if (show2FA) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [show2FA]);

  // Floating Bio-Luminescent Fireflies Array
  const fireflies = [
    { top: '15%', left: '12%', width: 8, height: 8, delay: '0s', duration: '6.5s' },
    { top: '25%', left: '82%', width: 12, height: 12, delay: '1s', duration: '8.5s' },
    { top: '65%', left: '18%', width: 10, height: 10, delay: '2s', duration: '7.2s' },
    { top: '75%', left: '78%', width: 7, height: 7, delay: '0.5s', duration: '5.8s' },
    { top: '38%', left: '88%', width: 9, height: 9, delay: '1.5s', duration: '9s' },
    { top: '82%', left: '10%', width: 11, height: 11, delay: '3s', duration: '6.8s' },
  ];

  if (showSplash) {
    return (
      <div className="auth-nature-backdrop" style={{
        flexDirection: 'column',
        opacity: splashFading ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}>
        {/* Pulsing Ambient Light Aura */}
        <div className="ambient-aura" />

        {/* Floating Fireflies */}
        {fireflies.map((f, i) => (
          <div
            key={i}
            className="firefly"
            style={{
              top: f.top, left: f.left, width: `${f.width}px`, height: `${f.height}px`,
              animationDelay: f.delay, animationDuration: f.duration,
            }}
          />
        ))}

        {/* Centered Splash Content Stack */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', zIndex: 10,
        }}>
          {/* ListenLeaf Logo — transparent, blended */}
          <img
            className="splash-logo-anim"
            src={LISTENLEAF_LOGO_URL}
            alt="ListenLeaf Logo"
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'contain',
              marginBottom: '1.2rem',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 8px 24px rgba(90,158,111,0.5))',
            }}
          />

          {/* Brand Name Title */}
          <h1 className="splash-title-anim" style={{
            fontSize: '2.5rem', fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.03em', margin: 0, textShadow: '0 4px 30px rgba(61,107,79,0.7)',
            fontFamily: 'var(--font-sans)',
          }}>
            ListenLeaf <span style={{ color: '#5a9e6f' }}>AI</span>
          </h1>

          {/* Subtitle */}
          <p className="splash-sub-anim" style={{
            fontSize: '0.92rem', color: 'rgba(255,255,255,0.78)',
            marginTop: '0.5rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            AI Wildlife Intelligence & Bioacoustics
          </p>

          {/* Loading Spinner Dots */}
          <div className="splash-sub-anim" style={{
            marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600,
          }}>
            <Sparkles style={{ width: '15px', height: '15px', color: 'var(--forest-light)' }} className="loading-spinner" />
            <span>Initializing secure portal...</span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 2FA OTP VERIFICATION SCREEN
  // ============================================================
  if (show2FA) {
    return (
      <div className="auth-nature-backdrop" style={{ animation: 'fadeIn 0.4s ease-out' }}>
        <div className="ambient-aura" />
        {fireflies.map((f, i) => (
          <div key={i} className="firefly" style={{
            top: f.top, left: f.left, width: `${f.width}px`, height: `${f.height}px`,
            animationDelay: f.delay, animationDuration: f.duration,
          }} />
        ))}

        <div className="auth-modal-solid modal-container anim-2" style={{
          width: '100%', maxWidth: '440px', padding: '2.2rem 2rem',
          borderRadius: 'var(--radius-2xl)',
          maxHeight: '92vh', overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3d6b4f, #2d5a3a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.8rem auto',
              boxShadow: '0 4px 16px rgba(61,107,79,0.3)',
            }}>
              <KeyRound style={{ width: '26px', height: '26px', color: '#ffffff' }} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0 }}>
              Two-Factor Authentication
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
              OTP sent to <strong>{maskedDest}</strong>
            </p>
            <span className="badge-forest" style={{ marginTop: '0.5rem', fontSize: '0.68rem' }}>
              <ShieldCheck style={{ width: '11px', height: '11px' }} />
              Email Verification
            </span>
          </div>

          {/* OTP Error */}
          {otpError && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.1rem',
              color: 'var(--rose)', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span>{otpError}</span>
            </div>
          )}

          {/* 6-Digit OTP Input Boxes */}
          <div style={{
            display: 'flex', gap: '0.6rem', justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { otpRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={idx === 0 ? handleOtpPaste : undefined}
                className="input-glass"
                style={{
                  width: '48px', height: '56px',
                  textAlign: 'center',
                  fontSize: '1.5rem', fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  borderColor: digit ? 'var(--forest)' : undefined,
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  caretColor: 'var(--forest)',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleOtpSubmit}
            disabled={otpLoading || otpDigits.some(d => !d)}
            className="btn-forest"
            style={{ marginBottom: '1rem', padding: '0.8rem' }}
          >
            {otpLoading ? (
              <>
                <Sparkles style={{ width: '17px', height: '17px' }} className="loading-spinner" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck style={{ width: '17px', height: '17px' }} />
                Verify OTP
              </>
            )}
          </button>

          {/* Resend & Back */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid var(--mint-border)', paddingTop: '1rem',
          }}>
            <button
              type="button"
              onClick={() => { setShow2FA(false); setPassword(''); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> Back to Login
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              style={{
                background: 'none', border: 'none',
                color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--forest)',
                fontWeight: 700, cursor: resendCooldown > 0 ? 'default' : 'pointer',
                fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-nature-backdrop" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Ambient aura glow */}
      <div className="ambient-aura" />

      {/* Floating Fireflies */}
      {fireflies.map((f, i) => (
        <div
          key={i}
          className="firefly"
          style={{
            top: f.top, left: f.left, width: `${f.width}px`, height: `${f.height}px`,
            animationDelay: f.delay, animationDuration: f.duration,
          }}
        />
      ))}
      <div className="auth-modal-solid modal-container anim-2" style={{
        position: 'relative',
        width: '100%', maxWidth: '480px', padding: '2.2rem 2rem',
        borderRadius: 'var(--radius-2xl)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'background 0.2s',
            }}
            title="Return to Landing Page"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        )}
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <img
            src={LISTENLEAF_LOGO_URL}
            alt="ListenLeaf Logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              margin: '0 auto 0.7rem auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(61,107,79,0.35))',
            }}
          />
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create Your Account' : 'Welcome to ListenLeaf AI'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            {isSignUp ? 'Register for first-time access to the bioacoustic platform.' : 'Log in to access your wildlife intelligence dashboard.'}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.1rem',
            color: 'var(--green)', fontSize: '0.8rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1.1rem',
            color: 'var(--rose)', fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {isSignUp && (
            <>
              {/* First & Last Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                    First Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="off"
                      className="input-glass"
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <User style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                    Last Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="off"
                      className="input-glass"
                      style={{ paddingLeft: '2.4rem' }}
                    />
                    <User style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Email Address *
                  </label>
                  {isSignUp && emailTaken && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--rose)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <AlertCircle style={{ width: '12px', height: '12px' }} /> Email already registered
                    </span>
                  )}
                  {isSignUp && !emailTaken && email.includes('@') && !checkingEmail && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Available
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    className="input-glass"
                    style={{
                      paddingLeft: '2.4rem',
                      borderColor: isSignUp && emailTaken ? 'var(--rose)' : undefined,
                    }}
                  />
                  <Mail style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </>
          )}

          {/* Username (Common for both Login & Sign Up) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                Username *
              </label>
              {isSignUp && usernameTaken && (
                <span style={{ fontSize: '0.7rem', color: 'var(--rose)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <AlertCircle style={{ width: '12px', height: '12px' }} /> Username already taken
                </span>
              )}
              {isSignUp && !usernameTaken && username.length >= 3 && !checkingUsername && (
                <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Available
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                className="input-glass"
                style={{
                  paddingLeft: '2.4rem',
                  borderColor: isSignUp && usernameTaken ? 'var(--rose)' : undefined,
                }}
              />
              <User style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Password (Common for both Login & Sign Up) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="input-glass"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Lock style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Password Complexity Requirements Badges (Sign Up only) */}
            {isSignUp && password.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.6rem',
                marginTop: '0.4rem', fontSize: '0.68rem', fontWeight: 600,
              }}>
                <span style={{ color: hasMinLength ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {hasMinLength ? <Check style={{ width: '11px', height: '11px' }} /> : <X style={{ width: '11px', height: '11px' }} />} 8+ chars
                </span>
                <span style={{ color: hasUpper ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {hasUpper ? <Check style={{ width: '11px', height: '11px' }} /> : <X style={{ width: '11px', height: '11px' }} />} Uppercase (A-Z)
                </span>
                <span style={{ color: hasLower ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {hasLower ? <Check style={{ width: '11px', height: '11px' }} /> : <X style={{ width: '11px', height: '11px' }} />} Lowercase (a-z)
                </span>
                <span style={{ color: hasDigit ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {hasDigit ? <Check style={{ width: '11px', height: '11px' }} /> : <X style={{ width: '11px', height: '11px' }} />} Number (0-9)
                </span>
                <span style={{ color: hasSymbol ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {hasSymbol ? <Check style={{ width: '11px', height: '11px' }} /> : <X style={{ width: '11px', height: '11px' }} />} Symbol (@,#,_,etc.)
                </span>
              </div>
            )}
          </div>

          {isSignUp && (
            <>
              {/* Re-enter Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Re-enter Password *
                  </label>
                  {confirmPassword && password !== confirmPassword && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--rose)', fontWeight: 700 }}>
                      Passwords do not match
                    </span>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700 }}>
                      Passwords match
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="input-glass"
                    style={{
                      paddingLeft: '2.4rem',
                      borderColor: confirmPassword && password !== confirmPassword ? 'var(--rose)' : undefined,
                    }}
                  />
                  <Lock style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Phone Number (Strict 10 Digits Only) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Phone Number (10 Digits) *
                  </label>
                  {phoneNumber && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      color: isPhoneValid ? 'var(--green)' : 'var(--rose)',
                    }}>
                      {isPhoneValid ? '✓ Valid 10 digits' : `${phoneNumber.length}/10 digits`}
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoComplete="off"
                    className="input-glass"
                    style={{
                      paddingLeft: '2.4rem',
                      borderColor: phoneNumber && !isPhoneValid ? 'var(--rose)' : undefined,
                    }}
                  />
                  <Phone style={{ width: '15px', height: '15px', color: 'var(--text-muted)', position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (isSignUp && (usernameTaken || emailTaken || !isPhoneValid || !isPasswordValid || password !== confirmPassword))}
            className="btn-forest"
            style={{ marginTop: '0.5rem', padding: '0.8rem' }}
          >
            {loading ? (
              <>
                <Sparkles style={{ width: '17px', height: '17px' }} className="loading-spinner" />
                {isSignUp ? 'Creating Account...' : 'Logging in...'}
              </>
            ) : isSignUp ? (
              <>
                <UserPlus style={{ width: '17px', height: '17px' }} />
                Sign Up
              </>
            ) : (
              <>
                <LogIn style={{ width: '17px', height: '17px' }} />
                Log In
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div style={{ marginTop: '1.3rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--mint-border)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isSignUp ? 'Already have an account?' : 'Logging in for the first time?'}
            {' '}
            <button
              type="button"
              onClick={() => toggleView(!isSignUp)}
              style={{
                background: 'none', border: 'none', color: 'var(--forest)',
                fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem',
                textDecoration: 'underline', fontFamily: 'var(--font-sans)',
              }}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
