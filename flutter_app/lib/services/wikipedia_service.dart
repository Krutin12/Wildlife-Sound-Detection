import 'package:dio/dio.dart';

/// Represents a live Wikipedia species entry.
class WikiSpecies {
  final String title;
  final String? description;
  final String extract;
  final String? thumbnailUrl;
  final String? pageUrl;

  WikiSpecies({
    required this.title,
    this.description,
    required this.extract,
    this.thumbnailUrl,
    this.pageUrl,
  });

  factory WikiSpecies.fromJson(Map<String, dynamic> json) {
    String? thumb;
    if (json['thumbnail'] is Map) {
      thumb = json['thumbnail']['source']?.toString();
    }
    String? page;
    if (json['content_urls'] is Map && json['content_urls']['desktop'] is Map) {
      page = json['content_urls']['desktop']['page']?.toString();
    }

    return WikiSpecies(
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      extract: json['extract']?.toString() ?? '',
      thumbnailUrl: thumb,
      pageUrl: page,
    );
  }
}

/// Service for querying live global Wikipedia biological species intelligence.
class WikipediaService {
  final Dio _dio = Dio();

  bool _isBiologicalSpecies(WikiSpecies summary) {
    if (summary.extract.isEmpty) return false;
    final titleLower = summary.title.toLowerCase();
    final descLower = (summary.description ?? '').toLowerCase();
    final text = '$titleLower $descLower ${summary.extract}'.toLowerCase();

    if (titleLower.startsWith('list of') ||
        titleLower.startsWith('index of') ||
        titleLower.startsWith('comparison of') ||
        descLower.contains('list article') ||
        descLower.contains('wikimedia list')) {
      return false;
    }

    const excludeKeywords = [
      'disambiguation', 'company', 'retailer', 'brand', 'clothing', 'album',
      'song', 'film', 'movie', 'city in', 'town in', 'village in', 'country in',
      'football club', 'video game', 'software', 'corporation', 'business'
    ];
    if (excludeKeywords.any((kw) => text.contains(kw))) return false;

    const speciesKeywords = [
      'species', 'genus', 'family', 'subspecies', 'taxon', 'taxonomic', 'organism',
      'bird', 'parrot', 'mammal', 'reptile', 'amphibian', 'insect', 'fish', 'animal', 'plant',
      'tree', 'fungus', 'fauna', 'flora', 'passerine', 'raptor', 'carnivore', 'herbivore',
      'primate', 'rodent', 'cetacean', 'mollusc', 'crustacean', 'canine', 'feline', 'wildlife'
    ];

    return speciesKeywords.any((kw) => text.contains(kw));
  }

  Future<WikiSpecies?> fetchSummary(String title) async {
    try {
      final res = await _dio.get('https://en.wikipedia.org/api/rest_v1/page/summary/${Uri.encodeComponent(title)}');
      if (res.statusCode == 200 && res.data is Map<String, dynamic>) {
        return WikiSpecies.fromJson(res.data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<WikiSpecies>> searchSpecies(String query) async {
    if (query.trim().length < 2) return [];
    final clean = query.trim();

    final resultsMap = <String, WikiSpecies>{};

    // 1. Direct summary attempt
    final direct = await fetchSummary(clean);
    if (direct != null && _isBiologicalSpecies(direct)) {
      resultsMap[direct.title] = direct;
    }

    // 2. Query search
    final searchQueries = ['$clean species', '$clean animal', clean];

    for (final sq in searchQueries) {
      if (resultsMap.length >= 6) break;

      try {
        final res = await _dio.get(
          'https://en.wikipedia.org/w/api.php',
          queryParameters: {
            'action': 'query',
            'list': 'search',
            'srsearch': sq,
            'format': 'json',
            'origin': '*',
            'srlimit': '6',
          },
        );

        if (res.statusCode == 200 && res.data is Map) {
          final items = res.data['query']?['search'] as List? ?? [];
          for (final item in items) {
            final title = item['title']?.toString() ?? '';
            if (resultsMap.containsKey(title) || title.toLowerCase().startsWith('list of')) {
              continue;
            }

            final summary = await fetchSummary(title);
            if (summary != null && _isBiologicalSpecies(summary)) {
              resultsMap[title] = summary;
            }
            if (resultsMap.length >= 6) break;
          }
        }
      } catch (_) {}
    }

    return resultsMap.values.toList();
  }
}
