import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_constants.dart';
import '../models/user_model.dart';

/// Manages local persistence: secure JWT storage and SharedPreferences.
class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<SharedPreferences> get prefs async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ── JWT Token ─────────────────────────────────────────────
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: AppConstants.tokenKey);
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: AppConstants.tokenKey);
  }

  // ── User Data ─────────────────────────────────────────────
  Future<void> saveUser(User user) async {
    final p = await prefs;
    await p.setString(AppConstants.userKey, user.toJsonString());
  }

  Future<User?> getUser() async {
    final p = await prefs;
    final json = p.getString(AppConstants.userKey);
    if (json == null || json.isEmpty) return null;
    try {
      return User.fromJsonString(json);
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteUser() async {
    final p = await prefs;
    await p.remove(AppConstants.userKey);
  }

  // ── Theme ─────────────────────────────────────────────────
  Future<void> saveThemeMode(bool isDark) async {
    final p = await prefs;
    await p.setBool(AppConstants.themeKey, isDark);
  }

  Future<bool> getIsDarkMode() async {
    final p = await prefs;
    return p.getBool(AppConstants.themeKey) ?? false;
  }

  // ── Base URL ──────────────────────────────────────────────
  Future<void> saveBaseUrl(String url) async {
    final p = await prefs;
    await p.setString(AppConstants.baseUrlKey, url);
  }

  Future<String> getBaseUrl() async {
    final p = await prefs;
    return p.getString(AppConstants.baseUrlKey) ?? AppConstants.defaultBaseUrl;
  }

  // ── Session ───────────────────────────────────────────────
  Future<bool> hasValidSession() async {
    final token = await getToken();
    final user = await getUser();
    return token != null && token.isNotEmpty && user != null;
  }

  Future<void> clearSession() async {
    await deleteToken();
    await deleteUser();
  }
}
