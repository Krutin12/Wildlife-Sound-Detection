import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/prediction_provider.dart';
import '../../widgets/confidence_bar.dart';

/// Hero identification showcase screen with ecological facts and rankings.
class PredictionResultScreen extends StatelessWidget {
  const PredictionResultScreen({super.key});

  Color _statusColor(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('critically') || lower.contains('endangered')) return AppTheme.error;
    if (lower.contains('vulnerable') || lower.contains('threatened')) return AppTheme.secondary;
    if (lower.contains('least concern')) return AppTheme.success;
    return AppTheme.info;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final provider = context.watch<PredictionProvider>();
    final result = provider.result;

    if (result == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Result')),
        body: const Center(child: Text('No bio-acoustic result available')),
      );
    }

    final confidencePercent = (result.confidence * 100).toStringAsFixed(1);
    final statusColor = _statusColor(result.conservationStatus);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Species Identification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            provider.clearResult();
            Navigator.pop(context);
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Result Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1B3827), Color(0xFF102419)],
                      )
                    : const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Colors.white, Color(0xFFF0FDF4)],
                      ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  width: 1.4,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: isDark ? 0.25 : 0.12),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Animated Match Gauge
                  SizedBox(
                    width: 126,
                    height: 126,
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: result.confidence),
                      duration: const Duration(milliseconds: 1400),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, child) {
                        return Stack(
                          fit: StackFit.expand,
                          children: [
                            CircularProgressIndicator(
                              value: value,
                              strokeWidth: 9,
                              backgroundColor: (isDark ? AppTheme.primaryDeep : AppTheme.primarySoft)
                                  .withValues(alpha: 0.4),
                              valueColor: AlwaysStoppedAnimation(
                                isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                              ),
                              strokeCap: StrokeCap.round,
                            ),
                            Center(child: child),
                          ],
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '$confidencePercent%',
                            style: GoogleFonts.outfit(
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                            ),
                          ),
                          Text(
                            'AI MATCH',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                              color: isDark ? AppTheme.textLightHint : AppTheme.textDarkHint,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Species Name & Scientific Name
                  Text(
                    result.commonName,
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    result.scientificName,
                    style: TextStyle(
                      fontSize: 14,
                      fontStyle: FontStyle.italic,
                      color: isDark ? AppTheme.textLightSecondary : AppTheme.textDarkSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),

                  // Badges Row
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      // Animal Class Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: (isDark ? AppTheme.primaryDark : AppTheme.primarySoft)
                              .withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.category_rounded, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 6),
                            Text(
                              result.animalClass,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Conservation Status Badge
                      if (result.conservationStatus != 'N/A' && result.conservationStatus.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(shape: BoxShape.circle, color: statusColor),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                result.conservationStatus,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Ecological Facts Matrix Header
            Text(
              'Ecological Profile',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),

            // 2x2 Ecology Grid
            Row(
              children: [
                Expanded(
                  child: _EcologyGlassCard(
                    icon: Icons.forest_rounded,
                    title: 'Habitat',
                    content: result.habitat,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _EcologyGlassCard(
                    icon: Icons.restaurant_rounded,
                    title: 'Diet',
                    content: result.diet,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _EcologyGlassCard(
                    icon: Icons.public_rounded,
                    title: 'Distribution',
                    content: result.distribution,
                    color: AppTheme.accentCyan,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _EcologyGlassCard(
                    icon: Icons.shield_rounded,
                    title: 'Status',
                    content: result.conservationStatus,
                    color: statusColor,
                  ),
                ),
              ],
            ),

            // Interesting Facts Card
            if (result.interestingFacts != 'N/A' && result.interestingFacts.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF14241A) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.secondary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.lightbulb_rounded, color: AppTheme.secondary, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Species Factsheet',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            result.interestingFacts,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  height: 1.45,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 28),

            // Top-5 Candidate Ranking
            if (result.topKPredictions.isNotEmpty) ...[
              Text(
                'Top Prediction Candidates',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 14),
              ...result.topKPredictions.asMap().entries.map((entry) {
                return ConfidenceBar(
                  label: entry.value.label,
                  confidence: entry.value.confidence,
                  rank: entry.key + 1,
                  isTop: entry.key == 0,
                );
              }),
            ],

            const SizedBox(height: 32),

            // New Scan Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: () {
                  provider.clearResult();
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.graphic_eq_rounded),
                label: const Text('SCAN ANOTHER VOCALIZATION'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EcologyGlassCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color color;

  const _EcologyGlassCard({
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
