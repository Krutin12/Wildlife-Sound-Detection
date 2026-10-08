import 'dart:io';
import 'package:dio/dio.dart';
import '../config/app_constants.dart';
import '../models/user_model.dart';
import '../models/prediction_model.dart';
import '../models/species_model.dart';
import '../models/history_model.dart';
import 'storage_service.dart';

/// Singleton HTTP client wrapping Dio for all backend API calls.
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;
  final StorageService _storage = StorageService();
  bool _initialised = false;

  /// Must be called once before using the service.
  Future<void> init() async {
    if (_initialised) return;
    final baseUrl = await _storage.getBaseUrl();
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 60),
      sendTimeout: const Duration(seconds: 60),
      headers: {'Accept': 'application/json'},
    ));

    // Auth interceptor – injects JWT token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
    _initialised = true;
  }

  /// Update the base URL at runtime (e.g. from Settings).
  Future<void> updateBaseUrl(String newUrl) async {
    await _storage.saveBaseUrl(newUrl);
    _dio.options.baseUrl = newUrl;
  }

  String get currentBaseUrl => _dio.options.baseUrl;

  // ── Health ────────────────────────────────────────────────
  Future<Map<String, dynamic>> healthCheck() async {
    final res = await _dio.get(AppConstants.healthEndpoint);
    return res.data as Map<String, dynamic>;
  }

  // ── Auth ──────────────────────────────────────────────────
  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String username,
    required String password,
    required String phoneNumber,
  }) async {
    final res = await _dio.post(AppConstants.registerEndpoint, data: {
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'username': username,
      'password': password,
      'phone_number': phoneNumber,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    final res = await _dio.post(AppConstants.loginEndpoint, data: {
      'username': username,
      'password': password,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String challengeId,
    required String otpCode,
  }) async {
    final res = await _dio.post(AppConstants.otpVerifyEndpoint, data: {
      'challenge_id': challengeId,
      'otp_code': otpCode,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> resendOtp({
    required String challengeId,
  }) async {
    final res = await _dio.post(AppConstants.otpResendEndpoint, data: {
      'challenge_id': challengeId,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkUsername(String username) async {
    final res =
        await _dio.get('${AppConstants.checkUsernameEndpoint}/$username');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkEmail(String email) async {
    final res = await _dio.get('${AppConstants.checkEmailEndpoint}/$email');
    return res.data as Map<String, dynamic>;
  }

  // ── Profile ───────────────────────────────────────────────
  Future<User> updateProfile({
    required int userId,
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
  }) async {
    final res = await _dio.put(
      AppConstants.profileEndpoint,
      data: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'phone_number': phoneNumber,
      },
      queryParameters: {'user_id': userId},
    );
    return User.fromJson(res.data as Map<String, dynamic>);
  }

  // ── 2FA ───────────────────────────────────────────────────
  Future<Map<String, dynamic>> get2faStatus(int userId) async {
    final res = await _dio.get(
      AppConstants.twoFaStatusEndpoint,
      queryParameters: {'user_id': userId},
    );
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> enable2fa({
    required int userId,
    required String method,
    required String password,
  }) async {
    final res = await _dio.post(
      AppConstants.twoFaEnableEndpoint,
      data: {'method': method, 'password': password},
      queryParameters: {'user_id': userId},
    );
    return res.data as Map<String, dynamic>;
  }

  Future<void> disable2fa({
    required int userId,
    required String password,
  }) async {
    await _dio.post(
      AppConstants.twoFaDisableEndpoint,
      data: {'password': password},
      queryParameters: {'user_id': userId},
    );
  }

  // ── Predict ───────────────────────────────────────────────
  Future<PredictionResult> uploadAudioForPrediction(
    File audioFile, {
    int topK = 5,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        audioFile.path,
        filename: audioFile.path.split(Platform.pathSeparator).last,
      ),
    });
    final res = await _dio.post(
      AppConstants.predictEndpoint,
      data: formData,
      queryParameters: {'top_k': topK},
    );
    return PredictionResult.fromJson(res.data as Map<String, dynamic>);
  }

  // ── History ───────────────────────────────────────────────
  Future<List<HistoryItem>> getHistory({int limit = 50}) async {
    final res = await _dio.get(
      AppConstants.historyEndpoint,
      queryParameters: {'limit': limit},
    );
    final list = res.data as List<dynamic>;
    return list
        .map((e) => HistoryItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteHistoryItem(int id) async {
    await _dio.delete('${AppConstants.historyEndpoint}/$id');
  }

  Future<void> clearHistory() async {
    await _dio.delete(AppConstants.historyEndpoint);
  }

  // ── Species ───────────────────────────────────────────────
  Future<List<Species>> getSpecies() async {
    final res = await _dio.get(AppConstants.speciesEndpoint);
    final list = res.data as List<dynamic>;
    return list
        .map((e) => Species.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
