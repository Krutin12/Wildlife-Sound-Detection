import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/species_model.dart';
import '../services/api_service.dart';

/// Manages species catalog state with search/filter capability.
class SpeciesProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<Species> _allSpecies = [];
  List<Species> _filteredSpecies = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  String _selectedClass = 'All';

  List<Species> get species => _filteredSpecies;
  List<Species> get allSpecies => _allSpecies;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedClass => _selectedClass;

  /// Get unique animal classes for filter chips.
  List<String> get availableClasses {
    final classes = _allSpecies.map((s) => s.animalClass).toSet().toList();
    classes.sort();
    return ['All', ...classes];
  }

  /// Fetch all species from backend.
  Future<void> fetchSpecies() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _allSpecies = await _api.getSpecies();
      _applyFilters();
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

  /// Update search query and filter.
  void searchSpecies(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  /// Filter by animal class.
  void filterByClass(String animalClass) {
    _selectedClass = animalClass;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    _filteredSpecies = _allSpecies.where((s) {
      final matchesClass =
          _selectedClass == 'All' || s.animalClass == _selectedClass;
      final matchesSearch = _searchQuery.isEmpty ||
          s.commonName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.scientificName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.speciesCode.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    }).toList();
  }

  String _extractError(DioException e) {
    if (e.response?.data is Map) {
      return (e.response!.data as Map)['detail']?.toString() ?? 'Failed to load species.';
    }
    return e.message ?? 'Failed to load species.';
  }
}
