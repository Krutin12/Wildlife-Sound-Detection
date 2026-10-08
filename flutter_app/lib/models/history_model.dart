/// A single prediction history record returned by GET /api/history.
class HistoryItem {
  final int id;
  final String predictedLabel;
  final String commonName;
  final String scientificName;
  final String animalClass;
  final double confidence;
  final String? filename;
  final String? createdAt;
  final String habitat;
  final String diet;
  final String distribution;
  final String conservationStatus;
  final String interestingFacts;

  const HistoryItem({
    required this.id,
    required this.predictedLabel,
    required this.commonName,
    required this.scientificName,
    required this.animalClass,
    required this.confidence,
    this.filename,
    this.createdAt,
    required this.habitat,
    required this.diet,
    required this.distribution,
    required this.conservationStatus,
    required this.interestingFacts,
  });

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      id: json['id'] as int? ?? 0,
      predictedLabel: json['predicted_label'] as String? ?? '',
      commonName: json['common_name'] as String? ?? '',
      scientificName: json['scientific_name'] as String? ?? '',
      animalClass: json['animal_class'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      filename: json['filename'] as String?,
      createdAt: json['created_at'] as String?,
      habitat: json['habitat'] as String? ?? 'N/A',
      diet: json['diet'] as String? ?? 'N/A',
      distribution: json['distribution'] as String? ?? 'N/A',
      conservationStatus: json['conservation_status'] as String? ?? 'N/A',
      interestingFacts: json['interesting_facts'] as String? ?? 'N/A',
    );
  }
}
