/// A single top-K prediction entry.
class PredictionItem {
  final String label;
  final double confidence;

  const PredictionItem({required this.label, required this.confidence});

  factory PredictionItem.fromJson(Map<String, dynamic> json) {
    return PredictionItem(
      label: json['label'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Full prediction result matching the backend PredictionResponse schema.
class PredictionResult {
  final String predictedLabel;
  final String commonName;
  final String scientificName;
  final String animalClass;
  final double confidence;
  final String habitat;
  final String diet;
  final String distribution;
  final String conservationStatus;
  final String interestingFacts;
  final List<PredictionItem> topKPredictions;

  // Bioacoustic and Inference fields (1:1 with backend & web app)
  final int? dominantFrequencyHz;
  final double? snrDb;
  final String? vocalizationPattern;
  final int? inferenceTimeMs;

  const PredictionResult({
    required this.predictedLabel,
    required this.commonName,
    required this.scientificName,
    required this.animalClass,
    required this.confidence,
    required this.habitat,
    required this.diet,
    required this.distribution,
    required this.conservationStatus,
    required this.interestingFacts,
    required this.topKPredictions,
    this.dominantFrequencyHz,
    this.snrDb,
    this.vocalizationPattern,
    this.inferenceTimeMs,
  });

  factory PredictionResult.fromJson(Map<String, dynamic> json) {
    return PredictionResult(
      predictedLabel: json['predicted_label'] as String? ?? '',
      commonName: json['common_name'] as String? ?? '',
      scientificName: json['scientific_name'] as String? ?? '',
      animalClass: json['animal_class'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      habitat: json['habitat'] as String? ?? 'N/A',
      diet: json['diet'] as String? ?? 'N/A',
      distribution: json['distribution'] as String? ?? 'N/A',
      conservationStatus: json['conservation_status'] as String? ?? 'N/A',
      interestingFacts: json['interesting_facts'] as String? ?? 'N/A',
      dominantFrequencyHz: (json['dominant_frequency_hz'] as num?)?.toInt(),
      snrDb: (json['snr_db'] as num?)?.toDouble(),
      vocalizationPattern: json['vocalization_pattern'] as String?,
      inferenceTimeMs: (json['inference_time_ms'] as num?)?.toInt(),
      topKPredictions: (json['top_k_predictions'] as List<dynamic>?)
              ?.map((e) => PredictionItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
