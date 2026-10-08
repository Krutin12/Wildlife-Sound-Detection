export interface PredictionItem {
  label: string;
  confidence: number;
}

export interface PredictionResponse {
  predicted_label: string;
  common_name: string;
  scientific_name: string;
  animal_class: string;
  confidence: number;
  habitat: string;
  diet: string;
  distribution: string;
  conservation_status: string;
  interesting_facts: string;
  top_k_predictions: PredictionItem[];
  
  // Extended Bioacoustic Intelligence Metrics
  dominant_frequency_hz?: number;
  call_duration_sec?: number;
  snr_db?: number;
  vocalization_pattern?: string;
  model_name?: string;
  inference_time_ms?: number;
  audio_quality_score?: number;
}

export interface HistoryRecord {
  id: number;
  filename: string;
  predicted_label: string;
  common_name: string;
  scientific_name: string;
  confidence: number;
  animal_class: string;
  habitat: string;
  diet: string;
  distribution: string;
  conservation_status: string;
  interesting_facts: string;
  top_k_predictions?: PredictionItem[];
  created_at: string;
}

export interface SpeciesRecord {
  id: number;
  primary_label: string;
  common_name: string;
  scientific_name: string;
  animal_class: string;
  habitat: string;
  diet: string;
  geographic_distribution: string;
  conservation_status: string;
  interesting_facts: string;
}

export interface DbStatus {
  active_db: 'mysql' | 'sqlite';
  mysql_available: boolean;
  mysql_connected: boolean;
  sqlite_path: string;
  history_count: number;
  species_count: number;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone_number: string;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

// ============================================================
// Two-Factor Authentication Types
// ============================================================

export interface LoginResponse {
  requires_2fa: boolean;
  challenge_id: string;
  method: string;
  masked_destination: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  method?: string;
  masked_email?: string;
  masked_phone?: string;
}

export interface RecoveryCodesResponse {
  codes: string[];
  message: string;
}

/** Union type for login endpoint which may return either AuthResponse or LoginResponse */
export type LoginResult = AuthResponse | LoginResponse;

export function isLoginResponse(data: LoginResult): data is LoginResponse {
  return 'requires_2fa' in data && (data as LoginResponse).requires_2fa === true;
}
