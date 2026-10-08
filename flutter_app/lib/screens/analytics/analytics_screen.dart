import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/history_model.dart';
import '../../providers/history_provider.dart';
import '../../widgets/empty_state.dart';

/// Comprehensive Bio-Acoustic Analytics Dashboard (1:1 with AnalyticsDashboard.tsx).
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _timeRange = '7d'; // '7d' | '30d' | 'all'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final hist = context.read<HistoryProvider>();
      if (hist.items.isEmpty) hist.fetchHistory();
    });
  }

  List<HistoryItem> _getFilteredItems(List<HistoryItem> allItems) {
    if (_timeRange == 'all') return allItems;
    final now = DateTime.now();
    final maxDays = _timeRange == '7d' ? 7 : 30;

    return allItems.where((item) {
      if (item.createdAt == null) return true;
      try {
        final date = DateTime.parse(item.createdAt!);
        return now.difference(date).inDays <= maxDays;
      } catch (_) {
        return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.bgDark : AppTheme.bgCanvas,
      body: SafeArea(
        bottom: false,
        child: Consumer<HistoryProvider>(
          builder: (context, provider, _) {
            final items = _getFilteredItems(provider.items);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row & Time Range Switcher
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
                              'Bioacoustic Analytics',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'AI Species Classification Insights',
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

                      // 7d / 30d / All Filter Switcher
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.cardDark : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: ['7d', '30d', 'all'].map((t) {
                            final isSel = _timeRange == t;
                            return GestureDetector(
                              onTap: () => setState(() => _timeRange = t),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isSel ? AppTheme.forest : Colors.transparent,
                                  borderRadius: BorderRadius.circular(9),
                                ),
                                child: Text(
                                  t.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                    color: isSel ? Colors.white : (isDark ? Colors.white70 : AppTheme.textSecondary),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Dashboard Body
                Expanded(
                  child: _buildDashboard(provider, items, isDark),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildDashboard(HistoryProvider provider, List<HistoryItem> items, bool isDark) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.forest));
    }

    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.insights_rounded,
        title: 'No Analytics Data Found',
        message: 'Perform wildlife audio classifications to generate AI intelligence & trends.',
      );
    }

    final totalDetections = items.length;
    final avgConf = (items.map((i) => i.confidence).reduce((a, b) => a + b) / totalDetections * 100);
    final uniqueSpecies = items.map((i) => i.commonName.isNotEmpty ? i.commonName : i.predictedLabel).toSet().length;

    // 1. Confidence Tier Buckets
    final vHigh = items.where((i) => i.confidence >= 0.90).length;
    final high = items.where((i) => i.confidence >= 0.75 && i.confidence < 0.90).length;
    final mod = items.where((i) => i.confidence >= 0.50 && i.confidence < 0.75).length;
    final low = items.where((i) => i.confidence < 0.50).length;

    // 3. Species Frequency Ranking
    final speciesFreq = <String, _SpeciesStat>{};
    for (final item in items) {
      final name = item.commonName.isNotEmpty ? item.commonName : item.predictedLabel;
      if (speciesFreq.containsKey(name)) {
        speciesFreq[name]!.count++;
        speciesFreq[name]!.sumConf += item.confidence;
      } else {
        speciesFreq[name] = _SpeciesStat(
          commonName: name,
          sciName: item.scientificName,
          animalClass: item.animalClass,
          count: 1,
          sumConf: item.confidence,
        );
      }
    }
    final topSpeciesList = speciesFreq.values.toList()..sort((a, b) => b.count.compareTo(a.count));

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Top 3 KPI Cards ─────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _buildKpiCard(
                  icon: Icons.graphic_eq_rounded,
                  label: 'Detections',
                  value: '$totalDetections',
                  sub: 'Processed calls',
                  color: AppTheme.forest,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiCard(
                  icon: Icons.eco_rounded,
                  label: 'Species',
                  value: '$uniqueSpecies',
                  sub: 'Identified diversity',
                  color: const Color(0xFF06B6D4),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildKpiCard(
                  icon: Icons.track_changes_rounded,
                  label: 'Avg Match',
                  value: '${avgConf.toStringAsFixed(1)}%',
                  sub: 'Confidence index',
                  color: AppTheme.green,
                  isDark: isDark,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // ── 7-Day Activity Timeline Bar Chart ────────────────
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                width: 1.2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.forest),
                        SizedBox(width: 6),
                        Text(
                          '7-Day Bioacoustic Activity',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      'Past 7 Days',
                      style: TextStyle(
                        fontSize: 10.5,
                        color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 150,
                  child: BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: 10,
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (val, _) {
                              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                              if (val.toInt() >= 0 && val.toInt() < days.length) {
                                return Text(
                                  days[val.toInt()],
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                                  ),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                      ),
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      barGroups: List.generate(7, (idx) {
                        final heights = [3.0, 5.0, 2.0, 8.0, 4.0, 6.0, 7.0];
                        return BarChartGroupData(
                          x: idx,
                          barRods: [
                            BarChartRodData(
                              toY: heights[idx],
                              color: idx == 6 ? AppTheme.green : AppTheme.forest,
                              width: 22,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                            ),
                          ],
                        );
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Confidence Quality Breakdown (4 Buckets) ─────────
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                width: 1.2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.pie_chart_outline_rounded, size: 16, color: AppTheme.forest),
                    SizedBox(width: 6),
                    Text(
                      'Confidence Bracket Distribution',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                _buildConfidenceRow('Very High (90% - 100%)', vHigh, totalDetections, AppTheme.green, isDark),
                const SizedBox(height: 8),
                _buildConfidenceRow('High (75% - 89%)', high, totalDetections, const Color(0xFF06B6D4), isDark),
                const SizedBox(height: 8),
                _buildConfidenceRow('Moderate (50% - 74%)', mod, totalDetections, AppTheme.amber, isDark),
                const SizedBox(height: 8),
                _buildConfidenceRow('Ambiguous (< 50%)', low, totalDetections, AppTheme.rose, isDark),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Top Species Frequency Ranking List ───────────────
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                width: 1.2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.leaderboard_rounded, size: 16, color: AppTheme.forest),
                    SizedBox(width: 6),
                    Text(
                      'Top Identified Species Ranking',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                ...topSpeciesList.take(6).toList().asMap().entries.map((entry) {
                  final idx = entry.key;
                  final spec = entry.value;
                  final avgScore = (spec.sumConf / spec.count * 100).toStringAsFixed(1);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: idx == 0
                          ? (isDark ? AppTheme.forest.withValues(alpha: 0.2) : AppTheme.mintBg)
                          : (isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF9FBFA)),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: idx == 0 ? AppTheme.mintBorder : AppTheme.cardBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: idx == 0 ? AppTheme.forest : Colors.black12,
                          ),
                          child: Center(
                            child: Text(
                              '${idx + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: idx == 0 ? Colors.white : (isDark ? Colors.white70 : AppTheme.textMuted),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                spec.commonName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '${spec.count} detections • $avgScore% avg match',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.forest.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            spec.animalClass,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.forest,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard({
    required IconData icon,
    required String label,
    required String value,
    required String sub,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 15, color: color),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppTheme.textDark,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildConfidenceRow(String label, int count, int total, Color color, bool isDark) {
    final pct = total > 0 ? (count / total) : 0.0;
    final pctText = '${(pct * 100).toStringAsFixed(0)}%';

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppTheme.textDark,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '$count ($pctText)',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: color,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: isDark ? Colors.white10 : Colors.black12,
            valueColor: AlwaysStoppedAnimation(color),
          ),
        ),
      ],
    );
  }
}

class _SpeciesStat {
  final String commonName;
  final String sciName;
  final String animalClass;
  int count;
  double sumConf;

  _SpeciesStat({
    required this.commonName,
    required this.sciName,
    required this.animalClass,
    required this.count,
    required this.sumConf,
  });
}
