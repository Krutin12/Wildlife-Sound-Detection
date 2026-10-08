import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Exact 4 Top KPI Metric Cards (1:1 with Screenshot & Web Layout).
class TopStatCards extends StatelessWidget {
  const TopStatCards({super.key});

  static const List<_StatData> _stats = [
    _StatData(
      value: '1,248',
      label: 'Sounds Processed',
      sub: 'This Month',
      change: '↑ 18%',
      icon: Icons.graphic_eq_rounded,
    ),
    _StatData(
      value: '92.4%',
      label: 'Avg. Accuracy',
      sub: 'Model Performance',
      change: '↑ 6.3%',
      icon: Icons.track_changes_rounded,
    ),
    _StatData(
      value: '312',
      label: 'Species Identified',
      sub: 'Across Database',
      change: '↑ 12%',
      icon: Icons.eco_rounded,
    ),
    _StatData(
      value: '18.7 hrs',
      label: 'Audio Analyzed',
      sub: 'This Month',
      change: '↑ 22%',
      icon: Icons.access_time_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Desktop / Tablet layout (>= 900px): 4 horizontal columns
        if (constraints.maxWidth >= 900) {
          return Row(
            children: _stats.map((s) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: _StatCard(data: s),
                ),
              );
            }).toList(),
          );
        }

        // Mobile layout (< 900px): 2x2 responsive grid with generous vertical headroom
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.40,
          children: _stats.map((s) => _StatCard(data: s)).toList(),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final _StatData data;

  const _StatCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Circular Mint Icon Avatar
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.mintBg.withValues(alpha: 0.25) : AppTheme.mintBg,
              shape: BoxShape.circle,
              border: Border.all(
                color: isDark ? AppTheme.mintBorder.withValues(alpha: 0.4) : AppTheme.mintBorder,
              ),
            ),
            child: Icon(
              data.icon,
              size: 16,
              color: isDark ? AppTheme.greenLight : AppTheme.forest,
            ),
          ),
          const SizedBox(width: 8),

          // Metric Values
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  data.value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDark,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  data.label,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        data.sub,
                        style: TextStyle(
                          fontSize: 8.5,
                          color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      data.change,
                      style: const TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.green,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatData {
  final String value;
  final String label;
  final String sub;
  final String change;
  final IconData icon;

  const _StatData({
    required this.value,
    required this.label,
    required this.sub,
    required this.change,
    required this.icon,
  });
}
