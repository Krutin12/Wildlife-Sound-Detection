import 'package:flutter/material.dart';
import '../services/storage_service.dart';

/// Manages light/dark theme state with local persistence.
class ThemeProvider extends ChangeNotifier {
  final StorageService _storage = StorageService();
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  /// Load saved theme preference.
  Future<void> loadTheme() async {
    final isDark = await _storage.getIsDarkMode();
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  /// Toggle between light and dark themes.
  Future<void> toggleTheme() async {
    _themeMode =
        _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    await _storage.saveThemeMode(isDarkMode);
    notifyListeners();
  }

  /// Set a specific theme mode.
  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    await _storage.saveThemeMode(isDarkMode);
    notifyListeners();
  }
}
