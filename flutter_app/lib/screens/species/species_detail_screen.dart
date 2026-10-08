import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';

/// Detailed view of a single species with ecological profile and IUCN status.
class SpeciesDetailScreen extends StatelessWidget {
  final Map<String, dynamic> speciesData;

  const SpeciesDetailScreen({super.key, required this.speciesData});

  Color _statusColor(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('critically') || lower.contains('endangered')) return AppTheme.error;
    if (lower.contains('vulnerable') || lower.contains('threatened')) return AppTheme.secondary;
    if (lower.contains('least concern')) return AppTheme.success;
    return AppTheme.info;
  }

  IconData _classIcon(String cls) {
    final lower = cls.toLowerCase();
    if (lower.contains('bird') || lower.contains('aves')) return Icons.flutter_dash_rounded;
    if (lower.contains('mammal')) return Icons.pets_rounded;
    if (lower.contains('amphibi')) return Icons.water_drop_rounded;
    if (lower.contains('reptil')) return Icons.cruelty_free_rounded;
    if (lower.contains('insect')) return Icons.bug_report_rounded;
    return Icons.park_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final commonName = speciesData['common_name'] ?? 'Unknown Species';
    final sciName = speciesData['scientific_name'] ?? '';
    final animalClass = speciesData['animal_class'] ?? 'Wildlife';
    final habitat = speciesData['habitat'] ?? 'N/A';
    final diet = speciesData['diet'] ?? 'N/A';
    final distribution = speciesData['distribution'] ?? 'N/A';
    final conservation = speciesData['conservation_status'] ?? 'N/A';
    final facts = speciesData['interesting_facts'] ?? 'N/A';
    final speciesCode = speciesData['species_code'] ?? '';

    final statusColor = _statusColor(conservation);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Collapsing Hero Header
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: isDark ? const Color(0xFF0C1A11) : AppTheme.primaryDark,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                commonName,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: isDark
                      ? const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF042013), Color(0xFF0F3823)],
                        )
                      : const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppTheme.primaryDeep, AppTheme.primary],
                        ),
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Icon(
                        _classIcon(animalClass),
                        size: 96,
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                    Positioned(
                      bottom: 50,
                      left: 20,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          speciesCode.isNotEmpty ? 'Code: $speciesCode' : animalClass,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Main Body Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Subtitle & Badges
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              sciName,
                              style: TextStyle(
                                fontStyle: FontStyle.italic,
                                fontSize: 15,
                                color: isDark ? AppTheme.textLightSecondary : AppTheme.textDarkSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Class Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: (isDark ? AppTheme.primaryDeep : AppTheme.primarySoft)
                              .withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          animalClass,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // 2x2 Ecology Matrix
                  Text(
                    'Ecological Classification',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _DetailGlassTile(
                          icon: Icons.forest_rounded,
                          title: 'Habitat',
                          content: habitat,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _DetailGlassTile(
                          icon: Icons.restaurant_rounded,
                          title: 'Diet',
                          content: diet,
                          color: AppTheme.secondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _DetailGlassTile(
                          icon: Icons.public_rounded,
                          title: 'Distribution',
                          content: distribution,
                          color: AppTheme.accentCyan,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _DetailGlassTile(
                          icon: Icons.shield_rounded,
                          title: 'IUCN Status',
                          content: conservation,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),

                  // Factsheet
                  if (facts != 'N/A' && facts.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Bio-Acoustic Factsheet',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF14241A) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.secondary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.auto_awesome_rounded,
                                    color: AppTheme.secondary, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Field Observation Notes',
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            facts,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  height: 1.5,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailGlassTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color color;

  const _DetailGlassTile({
    required this.icon,
    required this.title,
    required this.content,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final displayContent = (content.isEmpty || content == 'N/A') ? 'Unknown' : content;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF14241A) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? AppTheme.textLightHint : AppTheme.textDarkHint,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            displayContent,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
