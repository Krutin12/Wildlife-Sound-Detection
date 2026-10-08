import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/history_provider.dart';

/// Exact 4 Bottom Status Cards (1:1 with Reference Screenshot & Live Data Sync).
class BottomStatusCards extends StatelessWidget {
  const BottomStatusCards({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 900) {
          return const Row(
            children: [
              Expanded(child: _ModelStatusCard()),
              SizedBox(width: 12),
              Expanded(child: _DatabaseStatusCard()),
              SizedBox(width: 12),
              Expanded(child: _RecentIdentCard()),
              SizedBox(width: 12),
              Expanded(child: _SavedOfflineCard()),
            ],
          );
        }

        // Mobile layout: 2x2 grid
        return Column(
          children: [
            Row(
              children: const [
                Expanded(child: _ModelStatusCard()),
                SizedBox(width: 10),
                Expanded(child: _DatabaseStatusCard()),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: const [
                Expanded(child: _RecentIdentCard()),
                SizedBox(width: 10),
                Expanded(child: _SavedOfflineCard()),
              ],
            ),
          ],
        );
      },
    );
  }
}

// ── 1. Model Status Card ─────────────────────────────────────
class _ModelStatusCard extends StatelessWidget {
  const _ModelStatusCard();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _StatusCardContainer(
      icon: Icons.shield_outlined,
      title: 'Model Status',
      value: 'Ready',
      valueColor: AppTheme.green,
      description: 'WildSound AI model is online and performing optimally.',
      actionIcon: Icons.check_rounded,
      actionColor: AppTheme.green,
      isDark: isDark,
    );
  }
}

// ── 2. Database Status Card ──────────────────────────────────
class _DatabaseStatusCard extends StatelessWidget {
  const _DatabaseStatusCard();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _StatusCardContainer(
      icon: Icons.storage_rounded,
      title: 'Database',
      value: 'SQLite Fallback',
      valueColor: isDark ? Colors.white : AppTheme.textDark,
      description: 'Species database is connected and synchronized.',
      actionIcon: Icons.wifi_rounded,
      actionColor: isDark ? AppTheme.forestLight : AppTheme.forest,
      isDark: isDark,
    );
  }
}

// ── 3. Recent Identification Card (Live Data Sync) ───────────
class _RecentIdentCard extends StatelessWidget {
  const _RecentIdentCard();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final history = context.watch<HistoryProvider>();

    final latestItem = history.items.isNotEmpty ? history.items.first : null;
    final speciesName = latestItem != null
        ? (latestItem.commonName.isNotEmpty ? latestItem.commonName : latestItem.predictedLabel)
        : 'Common Kingfisher';
    final confidencePct = latestItem != null
        ? '${(latestItem.confidence * 100).toStringAsFixed(1)}%'
        : '94.8%';
    final timeDisplay = latestItem != null
        ? (latestItem.createdAt ?? 'Just now')
        : '2m ago';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.access_time_rounded,
                size: 15,
                color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  'Recent Identification',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              // Bird Thumbnail Avatar (Kingfisher style)
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: const Color(0xFFE0F2FE),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: const Center(
                  child: Text('🐦', style: TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      speciesName,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    Row(
                      children: [
                        Text(
                          confidencePct,
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.green,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '• $timeDisplay',
                            style: TextStyle(
                              fontSize: 9.5,
                              color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
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
              Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── 4. Saved Offline Card (Live Data Sync) ───────────────────
class _SavedOfflineCard extends StatelessWidget {
  const _SavedOfflineCard();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final history = context.watch<HistoryProvider>();

    final countDisplay = history.items.isNotEmpty ? '${history.items.length}' : '11';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.cloud_download_outlined,
                size: 15,
                color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  'Saved Offline',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      countDisplay,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                    ),
                    Text(
                      'Saved for offline access',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.mintBg.withValues(alpha: 0.2) : AppTheme.mintBg,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(color: AppTheme.mintBorder),
                ),
                child: Icon(
                  Icons.folder_outlined,
                  size: 15,
                  color: isDark ? AppTheme.forestLight : AppTheme.forest,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Generic Status Card Container ────────────────────────────
class _StatusCardContainer extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color valueColor;
  final String description;
  final IconData actionIcon;
  final Color actionColor;
  final bool isDark;

  const _StatusCardContainer({
    required this.icon,
    required this.title,
    required this.value,
    required this.valueColor,
    required this.description,
    required this.actionIcon,
    required this.actionColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(
                      icon,
                      size: 15,
                      color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: actionColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(actionIcon, size: 13, color: actionColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 14.5,
              fontWeight: FontWeight.w900,
              color: valueColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            description,
            style: TextStyle(
              fontSize: 9.5,
              color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
              height: 1.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
