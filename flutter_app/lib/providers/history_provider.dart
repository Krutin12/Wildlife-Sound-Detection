import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/history_model.dart';
import '../services/api_service.dart';

/// Manages prediction history state.
class HistoryProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<HistoryItem> _items = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<HistoryItem> get items => _items;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Fetch history from backend.
  Future<void> fetchHistory({int limit = 50}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _items = await _api.getHistory(limit: limit);
      _isLoading = false;
      notifyListeners();
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Delete a single history item.
  Future<bool> deleteItem(int id) async {
    try {
      await _api.deleteHistoryItem(id);
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Clear all history.
  Future<bool> clearAll() async {
    try {
      await _api.clearHistory();
      _items.clear();
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  String _extractError(DioException e) {
    if (e.response?.data is Map) {
      return (e.response!.data as Map)['detail']?.toString() ?? 'Failed to load history.';
    }
    return e.message ?? 'Failed to load history.';
  }
}
