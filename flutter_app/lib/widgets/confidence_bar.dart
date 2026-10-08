import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Animated horizontal bar showing prediction confidence ranking with medals and gradients.
class ConfidenceBar extends StatelessWidget {
  final String label;
  final double confidence;
  final int rank;
  final bool isTop;

  const ConfidenceBar({
    super.key,
    required this.label,
    required this.confidence,
    this.rank = 1,
    this.isTop = false,
  });

  String _rankMedal(int r) {
    switch (r) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '#$r';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final percent = (confidence * 100).clamp(0, 100);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isTop
            ? (isDark
                ? AppTheme.primaryDeep.withValues(alpha: 0.35)
                : AppTheme.primarySoft.withValues(alpha: 0.5))
            : (isDark ? const Color(0xFF14241A) : Colors.white),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isTop
              ? AppTheme.primary.withValues(alpha: 0.45)
              : (isDark ? AppTheme.borderDark : AppTheme.borderLight),
          width: isTop ? 1.4 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                _rankMedal(rank),
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: isTop ? FontWeight.w800 : FontWeight.w600,
                        color: isTop
                            ? (isDark ? AppTheme.primaryNeon : AppTheme.primaryDark)
                            : null,
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isTop
                      ? AppTheme.primary.withValues(alpha: 0.15)
                      : (isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.05)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${percent.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isTop
                        ? (isDark ? AppTheme.primaryNeon : AppTheme.primaryDark)
                        : (isDark ? AppTheme.textLightSecondary : AppTheme.textDarkSecondary),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: confidence.clamp(0, 1)),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return LinearProgressIndicator(
                  value: value,
                  minHeight: isTop ? 8 : 6,
                  backgroundColor: isDark
                      ? const Color(0xFF0F1E15)
                      : const Color(0xFFE2EFE5),
                  valueColor: AlwaysStoppedAnimation(
                    isTop ? AppTheme.primary : AppTheme.primaryLight,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
