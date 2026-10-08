/// App-wide constants and configuration for ListenLeaf.
class AppConstants {
  AppConstants._();

  // ── App Info ──────────────────────────────────────────────
  static const String appName = 'ListenLeaf';
  static const String appVersion = '1.0.0';
  static const String appTagline = 'Identify Wildlife by Sound';

  // ── API ───────────────────────────────────────────────────
  /// Default base URL for Android emulator (10.0.2.2 = host localhost).
  /// Change to your machine's LAN IP for physical devices.
  static const String defaultBaseUrl = 'http://192.168.0.155:8000';

  // Endpoint paths
  static const String healthEndpoint = '/health';
  static const String predictEndpoint = '/predict';
  static const String historyEndpoint = '/api/history';
  static const String speciesEndpoint = '/api/species';
  static const String registerEndpoint = '/api/auth/register';
  static const String loginEndpoint = '/api/auth/login';
  static const String profileEndpoint = '/api/auth/profile';
  static const String checkUsernameEndpoint = '/api/check-username';
  static const String checkEmailEndpoint = '/api/check-email';
  static const String otpVerifyEndpoint = '/api/auth/2fa/verify';
  static const String otpResendEndpoint = '/api/auth/2fa/resend';
  static const String twoFaStatusEndpoint = '/api/auth/2fa/status';
  static const String twoFaEnableEndpoint = '/api/auth/2fa/enable';
  static const String twoFaDisableEndpoint = '/api/auth/2fa/disable';

  // ── Storage Keys ──────────────────────────────────────────
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String baseUrlKey = 'api_base_url';

  // ── UI Constants ──────────────────────────────────────────
  static const double defaultPadding = 16.0;
  static const double cardRadius = 16.0;
  static const double buttonRadius = 12.0;
  static const double inputRadius = 12.0;

  // ── Audio ─────────────────────────────────────────────────
  static const int maxRecordingDurationSeconds = 30;
  static const List<String> allowedAudioExtensions = [
    'ogg', 'wav', 'mp3', 'flac', 'm4a',
  ];
}
