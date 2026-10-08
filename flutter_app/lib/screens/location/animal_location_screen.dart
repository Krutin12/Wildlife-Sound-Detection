import 'package:flutter/material.dart';
import '../../config/app_theme.dart';

/// Animal Location & Global Wildlife Forest Habitat Explorer (1:1 with React AnimalLocation.tsx).
class AnimalLocationScreen extends StatefulWidget {
  const AnimalLocationScreen({super.key});

  @override
  State<AnimalLocationScreen> createState() => _AnimalLocationScreenState();
}

class _AnimalLocationScreenState extends State<AnimalLocationScreen> {
  String _selectedContinent = 'All';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  static const List<String> _continents = [
    'All',
    'Asia',
    'Africa',
    'Americas',
    'Oceania',
    'Polar',
    'Global',
  ];

  static const List<_WildlifeLocation> _locations = [
    _WildlifeLocation(
      name: 'Gir National Park & Wildlife Sanctuary',
      region: 'Gujarat',
      country: 'India, Asia',
      continent: 'Asia',
      species: 'Asiatic Lion, Indian Leopard, Striped Hyena',
      lat: 21.1245,
      lng: 70.8242,
      emoji: '🦁',
      habitat: 'Dry Deciduous Teak Forest',
    ),
    _WildlifeLocation(
      name: 'Jim Corbett National Park',
      region: 'Uttarakhand',
      country: 'India, Asia',
      continent: 'Asia',
      species: 'Bengal Tiger, Asian Elephant, Crested Serpent Eagle',
      lat: 29.5300,
      lng: 78.7747,
      emoji: '🐅',
      habitat: 'Sub-Himalayan Sal Forest Belt',
    ),
    _WildlifeLocation(
      name: 'Kaziranga National Park Forest',
      region: 'Assam',
      country: 'India, Asia',
      continent: 'Asia',
      species: 'Indian Rhinoceros, Wild Water Buffalo, Swamp Deer',
      lat: 26.5775,
      lng: 93.1711,
      emoji: '🦏',
      habitat: 'Brahmaputra Floodplain Grasslands',
    ),
    _WildlifeLocation(
      name: 'Sundarbans Mangrove Biosphere',
      region: 'West Bengal',
      country: 'India, Asia',
      continent: 'Asia',
      species: 'Royal Bengal Tiger, Estuarine Crocodile, Fishing Cat',
      lat: 21.9497,
      lng: 89.1833,
      emoji: '🐊',
      habitat: 'Tidal Halophytic Mangrove Swamps',
    ),
    _WildlifeLocation(
      name: 'Serengeti National Park & Mara Ecosystem',
      region: 'Mara Region',
      country: 'Tanzania, Africa',
      continent: 'Africa',
      species: 'African Bush Elephant, Cheetah, Blue Wildebeest',
      lat: -2.3333,
      lng: 34.8333,
      emoji: '🐘',
      habitat: 'Acacia Savanna Grasslands',
    ),
    _WildlifeLocation(
      name: 'Central Amazon Rainforest Reserve',
      region: 'Amazonas',
      country: 'Brazil, South America',
      continent: 'Americas',
      species: 'Jaguar, Harpy Eagle, Amazon River Dolphin',
      lat: -3.4653,
      lng: -62.2159,
      emoji: '🦜',
      habitat: 'Dense Tropical Amazonian Lowland Forest',
    ),
    _WildlifeLocation(
      name: 'Daintree Rainforest National Park',
      region: 'Queensland',
      country: 'Australia, Oceania',
      continent: 'Oceania',
      species: 'Southern Cassowary, Tree Kangaroo, Saltwater Crocodile',
      lat: -16.2833,
      lng: 145.4000,
      emoji: '🦘',
      habitat: 'Ancient Gondwana Wet Tropical Rainforest',
    ),
    _WildlifeLocation(
      name: 'Svalbard Arctic Tundra Reserve',
      region: 'Spitsbergen',
      country: 'Norway, Arctic',
      continent: 'Polar',
      species: 'Polar Bear, Arctic Fox, Walrus, Svalbard Reindeer',
      lat: 78.2232,
      lng: 15.6267,
      emoji: '🐻‍❄️',
      habitat: 'High Arctic Permafrost Tundra',
    ),
    _WildlifeLocation(
      name: 'Galapagos Marine Reserve & Islands',
      region: 'Galapagos Province',
      country: 'Ecuador, Americas',
      continent: 'Americas',
      species: 'Marine Iguana, Galapagos Giant Tortoise, Blue-footed Booby',
      lat: -0.9538,
      lng: -90.9656,
      emoji: '🐢',
      habitat: 'Volcanic Oceanic Archipelago',
    ),
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = _locations.where((loc) {
      final matchesContinent = _selectedContinent == 'All' || loc.continent == _selectedContinent;
      final query = _searchQuery.toLowerCase();
      final matchesSearch = _searchQuery.isEmpty ||
          loc.name.toLowerCase().contains(query) ||
          loc.country.toLowerCase().contains(query) ||
          loc.species.toLowerCase().contains(query) ||
          loc.habitat.toLowerCase().contains(query);
      return matchesContinent && matchesSearch;
    }).toList();

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: isDark ? AppTheme.darkMeshGradient : null,
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Animal Location',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.5,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'Global Wildlife Habitats & National Parks',
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.mintBg : AppTheme.primarySoft,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.mintBorder),
                      ),
                      child: Text(
                        '${filtered.length} Reserves',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _searchQuery = v),
                  decoration: InputDecoration(
                    hintText: 'Search parks, countries, species or habitats…',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                  ),
                ),
              ),

              const SizedBox(height: 6),

              // Continent Filter Tabs
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _continents.length,
                  itemBuilder: (context, i) {
                    final c = _continents[i];
                    final isSelected = c == _selectedContinent;

                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: FilterChip(
                        selected: isSelected,
                        label: Text(c),
                        selectedColor: isDark ? AppTheme.forestDark : AppTheme.primarySoft,
                        checkmarkColor: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                          color: isSelected
                              ? (isDark ? Colors.white : AppTheme.forestDark)
                              : (isDark ? AppTheme.textLightSecondary : AppTheme.textDarkSecondary),
                        ),
                        onSelected: (_) => setState(() => _selectedContinent = c),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              // Locations List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 110),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final loc = filtered[index];
                    return _LocationCard(location: loc);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final _WildlifeLocation location;

  const _LocationCard({required this.location});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E3524) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Emoji Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.mintBg : AppTheme.primarySoft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.mintBorder),
                ),
                child: Center(
                  child: Text(
                    location.emoji,
                    style: const TextStyle(fontSize: 22),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Name & Country
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      location.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.place_rounded,
                          size: 13,
                          color: isDark ? AppTheme.forestLight : AppTheme.forest,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${location.region}, ${location.country}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Continent Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.mintBg : AppTheme.primarySoft,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  location.continent,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Habitat & Key Species
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF142418) : const Color(0xFFF9FBFA),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.forest_rounded, size: 13, color: AppTheme.forestLight),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        location.habitat,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppTheme.textLightPrimary : AppTheme.textDark,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.pets_rounded, size: 13, color: AppTheme.amber),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Key Species: ${location.species}',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Coordinates & Map Trigger
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Lat: ${location.lat.toStringAsFixed(4)} • Lng: ${location.lng.toStringAsFixed(4)}',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontFamily: 'monospace',
                    color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Bio-Acoustic Zone',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.sensors_rounded,
                    size: 13,
                    color: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WildlifeLocation {
  final String name;
  final String region;
  final String country;
  final String continent;
  final String species;
  final double lat;
  final double lng;
  final String emoji;
  final String habitat;

  const _WildlifeLocation({
    required this.name,
    required this.region,
    required this.country,
    required this.continent,
    required this.species,
    required this.lat,
    required this.lng,
    required this.emoji,
    required this.habitat,
  });
}
