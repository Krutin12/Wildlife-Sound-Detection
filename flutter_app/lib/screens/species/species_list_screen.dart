import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../providers/species_provider.dart';
import '../../services/wikipedia_service.dart';
import '../../widgets/species_card.dart';
import '../../widgets/empty_state.dart';

/// Species Library & Knowledge Base with Live Global Wikipedia Integration (1:1 with Web App).
class SpeciesListScreen extends StatefulWidget {
  const SpeciesListScreen({super.key});

  @override
  State<SpeciesListScreen> createState() => _SpeciesListScreenState();
}

class _SpeciesListScreenState extends State<SpeciesListScreen> {
  final _searchCtrl = TextEditingController();
  final WikipediaService _wikiService = WikipediaService();

  List<WikiSpecies> _wikiResults = [];
  bool _wikiLoading = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<SpeciesProvider>();
      if (provider.allSpecies.isEmpty) {
        provider.fetchSpecies();
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query, SpeciesProvider provider) {
    provider.searchSpecies(query);

    _debounceTimer?.cancel();
    if (query.trim().length < 2) {
      setState(() {
        _wikiResults = [];
        _wikiLoading = false;
      });
      return;
    }

    setState(() => _wikiLoading = true);
    _debounceTimer = Timer(const Duration(milliseconds: 450), () async {
      final results = await _wikiService.searchSpecies(query);
      if (mounted) {
        setState(() {
          _wikiResults = results;
          _wikiLoading = false;
        });
      }
    });
  }

  void _showWikiModal(WikiSpecies wiki) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 540, maxHeight: 680),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.mintBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.mintBorder),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.public_rounded, size: 12, color: AppTheme.green),
                            SizedBox(width: 4),
                            Text(
                              'Wikipedia Intelligence',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    wiki.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (wiki.description != null && wiki.description!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      wiki.description!,
                      style: const TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: AppTheme.forest,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (wiki.thumbnailUrl != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        wiki.thumbnailUrl!,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF142419) : const Color(0xFFF7FAF8),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Text(
                      wiki.extract,
                      style: const TextStyle(fontSize: 12.5, height: 1.55),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.forest,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close Factsheet', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.bgDark : AppTheme.bgCanvas,
      body: SafeArea(
        bottom: false,
        child: Consumer<SpeciesProvider>(
          builder: (context, provider, _) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row
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
                              'Species Library',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Local Bioacoustic Database & Live Wikipedia',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
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
                          color: isDark ? AppTheme.mintBg.withValues(alpha: 0.2) : AppTheme.mintBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.mintBorder),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.public_rounded, size: 13, color: AppTheme.green),
                            SizedBox(width: 4),
                            Text(
                              'Live Wikipedia',
                              style: TextStyle(
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Search Input Field
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (q) => _onSearchChanged(q, provider),
                    decoration: InputDecoration(
                      hintText: 'Search any species (e.g. kingfisher, thrush, eagle)...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _wikiLoading
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.forest),
                              ),
                            )
                          : (_searchCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded),
                                  onPressed: () {
                                    _searchCtrl.clear();
                                    _onSearchChanged('', provider);
                                  },
                                )
                              : null),
                    ),
                  ),
                ),

                // Class Filter Chips
                if (provider.availableClasses.length > 1)
                  SizedBox(
                    height: 38,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: provider.availableClasses.length,
                      itemBuilder: (context, i) {
                        final cls = provider.availableClasses[i];
                        final isSelected = cls == provider.selectedClass;

                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: FilterChip(
                            selected: isSelected,
                            label: Text(cls),
                            selectedColor: isDark ? AppTheme.forestDark : AppTheme.mintBg,
                            checkmarkColor: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                            labelStyle: TextStyle(
                              fontSize: 11.5,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                              color: isSelected
                                  ? (isDark ? Colors.white : AppTheme.forestDark)
                                  : (isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary),
                            ),
                            onSelected: (_) => provider.filterByClass(cls),
                          ),
                        );
                      },
                    ),
                  ),

                const SizedBox(height: 8),

                // Main Species Catalog & Live Wikipedia Results
                Expanded(
                  child: _buildList(provider, isDark),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildList(SpeciesProvider provider, bool isDark) {
    if (provider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.forest),
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      children: [
        // Live Global Wikipedia Search Section
        if (_wikiResults.isNotEmpty) ...[
          Row(
            children: const [
              Icon(Icons.auto_awesome_rounded, size: 14, color: AppTheme.green),
              SizedBox(width: 6),
              Text(
                'LIVE WIKIPEDIA INTELLIGENCE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.green,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ..._wikiResults.map((wiki) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF06B6D4).withValues(alpha: 0.3)),
              ),
              child: ListTile(
                leading: wiki.thumbnailUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          wiki.thumbnailUrl!,
                          width: 44,
                          height: 44,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.public_rounded, color: AppTheme.forest),
                        ),
                      )
                    : const Icon(Icons.public_rounded, color: Color(0xFF06B6D4)),
                title: Text(
                  wiki.title,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                ),
                subtitle: Text(
                  wiki.description ?? wiki.extract,
                  style: const TextStyle(fontSize: 11),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                onTap: () => _showWikiModal(wiki),
              ),
            );
          }),
          const SizedBox(height: 16),
        ],

        // Local Database Species Section Header
        Row(
          children: [
            const Icon(Icons.eco_rounded, size: 14, color: AppTheme.forest),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'BIOACOUSTIC DATABASE SPECIES (${provider.species.length})',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                  letterSpacing: 0.5,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        if (provider.species.isEmpty && _wikiResults.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: EmptyState(
              icon: Icons.park_outlined,
              title: 'No Species Found',
              message: 'Try typing any wildlife name to query local & Wikipedia intelligence.',
            ),
          )
        else
          ...provider.species.map((s) {
            return SpeciesCard(
              commonName: s.commonName,
              scientificName: s.scientificName,
              animalClass: s.animalClass,
              onTap: () {
                Navigator.pushNamed(
                  context,
                  AppRouter.speciesDetail,
                  arguments: s.toJson(),
                );
              },
            );
          }),
      ],
    );
  }
}
