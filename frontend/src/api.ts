import { PredictionResponse, HistoryRecord, SpeciesRecord, DbStatus, AuthResponse, LoginResult, TwoFactorStatus, RecoveryCodesResponse, UserProfile } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function uploadAudioForPrediction(file: File, topK: number = 5): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/predict?top_k=${topK}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to predict audio' }));
    throw new Error(errorData.detail || `Server returned status ${response.status}`);
  }

  return response.json();
}

export async function fetchPredictionHistory(): Promise<HistoryRecord[]> {
  const response = await fetch(`${API_BASE}/api/history`);
  if (!response.ok) {
    throw new Error('Failed to load prediction history from database');
  }
  return response.json();
}

export async function deleteHistoryRecord(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete history item');
  }
}

export async function clearAllPredictionHistory(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/history`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to clear prediction history');
  }
}

export async function fetchSpeciesLibrary(): Promise<SpeciesRecord[]> {
  const response = await fetch(`${API_BASE}/api/species`);
  if (!response.ok) {
    throw new Error('Failed to fetch species list');
  }
  return response.json();
}

export async function fetchDbStatus(): Promise<DbStatus> {
  const response = await fetch(`${API_BASE}/api/db-status`);
  if (!response.ok) {
    throw new Error('Failed to fetch database status');
  }
  return response.json();
}

export async function checkUsernameAvailability(username: string): Promise<{ exists: boolean; available: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/check-username/${encodeURIComponent(username.trim())}`);
  if (!response.ok) {
    return { exists: false, available: true, message: 'Username available' };
  }
  return response.json();
}

export async function checkEmailAvailability(email: string): Promise<{ exists: boolean; available: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/check-email/${encodeURIComponent(email.trim())}`);
  if (!response.ok) {
    return { exists: false, available: true, message: 'Email available' };
  }
  return response.json();
}

export async function registerUser(userData: {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  phone_number: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  return data;
}

async function parseJsonResponse<T = any>(response: Response, defaultError: string): Promise<T> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => '');
    throw new Error(text || response.statusText || defaultError);
  }
  if (!response.ok) {
    throw new Error(data?.detail || defaultError);
  }
  return data;
}

export async function loginUser(credentials: { username: string; password: string }): Promise<LoginResult> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  return parseJsonResponse<LoginResult>(response, 'Invalid username or password');
}


// ============================================================
// Two-Factor Authentication API
// ============================================================

export async function verifyOtp(challengeId: string, otpCode: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId, otp_code: otpCode }),
  });

  return parseJsonResponse<AuthResponse>(response, 'OTP verification failed');
}

export async function resendOtp(challengeId: string): Promise<{ message: string; masked_destination: string }> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId }),
  });

  return parseJsonResponse<{ message: string; masked_destination: string }>(response, 'Failed to resend OTP');
}

export async function get2faStatus(userId: number): Promise<TwoFactorStatus> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/status?user_id=${userId}`);
  return parseJsonResponse<TwoFactorStatus>(response, 'Failed to fetch 2FA status');
}

export async function enable2fa(userId: number, method: string, password: string): Promise<RecoveryCodesResponse> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/enable?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, password }),
  });

  return parseJsonResponse<RecoveryCodesResponse>(response, 'Failed to enable 2FA');
}

export async function disable2fa(userId: number, password: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/2fa/disable?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  return parseJsonResponse<{ message: string }>(response, 'Failed to disable 2FA');
}

export async function updateUserProfile(
  userId: number,
  data: { first_name: string; last_name: string; email: string; phone_number: string }
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/auth/profile?user_id=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<UserProfile>(response, 'Failed to update profile');
}
