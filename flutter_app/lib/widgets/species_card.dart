import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Next-Gen Species Card with class-specific avatar, taxonomy subtitle, and classification chip.
class SpeciesCard extends StatelessWidget {
  final String commonName;
  final String scientificName;
  final String animalClass;
  final VoidCallback? onTap;

  const SpeciesCard({
    super.key,
    required this.commonName,
    required this.scientificName,
    required this.animalClass,
    this.onTap,
  });

  IconData _classIcon() {
    final lower = animalClass.toLowerCase();
    if (lower.contains('bird') || lower.contains('aves')) return Icons.flutter_dash_rounded;
    if (lower.contains('mammal')) return Icons.pets_rounded;
    if (lower.contains('amphibi')) return Icons.water_drop_rounded;
    if (lower.contains('reptil')) return Icons.cruelty_free_rounded;
    if (lower.contains('insect')) return Icons.bug_report_rounded;
    return Icons.park_rounded;
  }

  Color _classColor() {
    final lower = animalClass.toLowerCase();
    if (lower.contains('bird') || lower.contains('aves')) return AppTheme.primary;
    if (lower.contains('mammal')) return AppTheme.secondary;
    if (lower.contains('amphibi')) return AppTheme.accentCyan;
    if (lower.contains('reptil')) return AppTheme.warning;
    if (lower.contains('insect')) return AppTheme.accentRose;
    return AppTheme.primaryLight;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = _classColor();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF14261B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: isDark ? 0.08 : 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Class Avatar Badge
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: isDark ? 0.20 : 0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                  ),
                  child: Center(
                    child: Icon(_classIcon(), color: color, size: 24),
                  ),
                ),
                const SizedBox(width: 14),

                // Name & Scientific Taxonomy
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        commonName,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        scientificName,
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          fontSize: 12,
                          color: isDark ? AppTheme.textLightSecondary : AppTheme.textDarkSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                // Class Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    animalClass,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: color,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: isDark ? AppTheme.textLightHint : AppTheme.textDarkHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
