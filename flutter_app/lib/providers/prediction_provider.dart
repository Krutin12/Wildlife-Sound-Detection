import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/prediction_model.dart';
import '../services/api_service.dart';

/// Manages the audio prediction state.
class PredictionProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  PredictionResult? _result;
  bool _isAnalyzing = false;
  String? _errorMessage;

  PredictionResult? get result => _result;
  bool get isAnalyzing => _isAnalyzing;
  String? get errorMessage => _errorMessage;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearResult() {
    _result = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Upload audio file for prediction.
  Future<bool> analyzeAudio(File audioFile, {int topK = 5}) async {
    _isAnalyzing = true;
    _errorMessage = null;
    _result = null;
    notifyListeners();

    try {
      _result = await _api.uploadAudioForPrediction(audioFile, topK: topK);
      _isAnalyzing = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        _errorMessage = (e.response!.data as Map)['detail']?.toString() ??
            'Prediction failed.';
      } else if (e.type == DioExceptionType.connectionError) {
        _errorMessage = 'Could not connect to server.';
      } else {
        _errorMessage = e.message ?? 'Prediction failed.';
      }
      _isAnalyzing = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _isAnalyzing = false;
      notifyListeners();
      return false;
    }
  }
}
