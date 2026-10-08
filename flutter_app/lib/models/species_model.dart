/// Species catalog item returned by GET /api/species.
class Species {
  final int? id;
  final String speciesCode;
  final String commonName;
  final String scientificName;
  final String animalClass;
  final String habitat;
  final String diet;
  final String distribution;
  final String conservationStatus;
  final String interestingFacts;

  const Species({
    this.id,
    required this.speciesCode,
    required this.commonName,
    required this.scientificName,
    required this.animalClass,
    required this.habitat,
    required this.diet,
    required this.distribution,
    required this.conservationStatus,
    required this.interestingFacts,
  });

  factory Species.fromJson(Map<String, dynamic> json) {
    return Species(
      id: json['id'] as int?,
      speciesCode: json['species_code'] as String? ??
          json['label'] as String? ??
          '',
      commonName: json['common_name'] as String? ?? '',
      scientificName: json['scientific_name'] as String? ?? '',
      animalClass: json['animal_class'] as String? ??
          json['class'] as String? ??
          '',
      habitat: json['habitat'] as String? ?? 'N/A',
      diet: json['diet'] as String? ?? 'N/A',
      distribution: json['distribution'] as String? ??
          json['geographic_distribution'] as String? ??
          'N/A',
      conservationStatus: json['conservation_status'] as String? ?? 'N/A',
      interestingFacts: json['interesting_facts'] as String? ?? 'N/A',
    );
  }

  Map<String, dynamic> toJson() => {
    'species_code': speciesCode,
    'common_name': commonName,
    'scientific_name': scientificName,
    'animal_class': animalClass,
    'habitat': habitat,
    'diet': diet,
    'distribution': distribution,
    'conservation_status': conservationStatus,
    'interesting_facts': interestingFacts,
  };
}
