import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

/// Manages authentication state: login, register, OTP, session persistence.
class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  User? _user;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isAuthenticated = false;

  // 2FA challenge state
  String? _challengeId;
  String? _maskedDestination;
  String? _challengeMethod;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _isAuthenticated;
  String? get challengeId => _challengeId;
  String? get maskedDestination => _maskedDestination;
  String? get challengeMethod => _challengeMethod;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Try to restore a saved session on app start.
  Future<bool> loadSavedSession() async {
    try {
      if (await _storage.hasValidSession()) {
        _user = await _storage.getUser();
        _isAuthenticated = _user != null;
        notifyListeners();
        return _isAuthenticated;
      }
    } catch (_) {}
    return false;
  }

  /// Register a new user.
  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String username,
    required String password,
    required String phoneNumber,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _api.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        username: username,
        password: password,
        phoneNumber: phoneNumber,
      );

      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      _user = User.fromJson(userJson);
      _isAuthenticated = true;

      await _storage.saveToken(token);
      await _storage.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Login. Returns 'success', 'requires_2fa', or 'error'.
  Future<String> login({
    required String username,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _api.login(username: username, password: password);

      // Check if 2FA is required
      if (data['requires_2fa'] == true) {
        _challengeId = data['challenge_id'] as String?;
        _maskedDestination = data['masked_destination'] as String?;
        _challengeMethod = data['method'] as String?;
        _isLoading = false;
        notifyListeners();
        return 'requires_2fa';
      }

      // Direct login (no 2FA)
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      _user = User.fromJson(userJson);
      _isAuthenticated = true;

      await _storage.saveToken(token);
      await _storage.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return 'success';
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return 'error';
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return 'error';
    }
  }

  /// Verify OTP for 2FA.
  Future<bool> verifyOtp(String otpCode) async {
    if (_challengeId == null) return false;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _api.verifyOtp(
        challengeId: _challengeId!,
        otpCode: otpCode,
      );

      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      _user = User.fromJson(userJson);
      _isAuthenticated = true;
      _challengeId = null;

      await _storage.saveToken(token);
      await _storage.saveUser(_user!);

      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Resend OTP.
  Future<bool> resendOtp() async {
    if (_challengeId == null) return false;
    try {
      final data = await _api.resendOtp(challengeId: _challengeId!);
      _maskedDestination =
          data['masked_destination'] as String? ?? _maskedDestination;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  /// Update user profile.
  Future<bool> updateProfile({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
  }) async {
    if (_user == null) return false;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _api.updateProfile(
        userId: _user!.id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phoneNumber: phoneNumber,
      );
      await _storage.saveUser(_user!);
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout and clear session.
  Future<void> logout() async {
    await _storage.clearSession();
    _user = null;
    _isAuthenticated = false;
    _challengeId = null;
    notifyListeners();
  }

  /// Extract a user-friendly error message from DioException.
  String _extractError(DioException e) {
    if (e.response?.data is Map) {
      final detail = (e.response!.data as Map)['detail'];
      if (detail != null) return detail.toString();
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Connection timed out. Please check your network.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Could not connect to server. Check the API URL in Settings.';
    }
    return e.message ?? 'An unexpected error occurred.';
  }
}
