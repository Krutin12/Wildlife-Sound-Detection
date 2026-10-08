import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/prediction_provider.dart';
import '../../providers/history_provider.dart';
import '../../services/audio_service.dart';
import '../../widgets/top_stat_cards.dart';
import '../../widgets/bottom_status_cards.dart';
import '../../widgets/circular_confidence_ring.dart';
import '../../widgets/acoustic_intelligence_card.dart';

/// Main Canvas for Wildlife Sound Identification with In-Place Analysis Results (No Redirect).
class DetectScreen extends StatefulWidget {
  const DetectScreen({super.key});

  @override
  State<DetectScreen> createState() => _DetectScreenState();
}

class _DetectScreenState extends State<DetectScreen> {
  final AudioService _audio = AudioService();
  String? _selectedFilePath;
  bool _isPlaying = false;
  double _sliderValue = 0.0;

  Future<void> _pickFile() async {
    final file = await _audio.pickAudioFile();
    if (file != null) {
      setState(() {
        _selectedFilePath = file.path;
      });
    }
  }

  Future<void> _analyze() async {
    if (_selectedFilePath == null) return;

    final provider = context.read<PredictionProvider>();
    final success = await provider.analyzeAudio(File(_selectedFilePath!));

    if (!mounted) return;

    if (success) {
      context.read<HistoryProvider>().fetchHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Bio-acoustic prediction failed.'),
          backgroundColor: AppTheme.rose,
        ),
      );
    }
    // Note: On success, we DO NOT redirect! The result is rendered in-place directly in the Analysis Preview card.
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();
    final pred = context.watch<PredictionProvider>();
    final user = auth.user;

    final userName = user != null ? user.fullName : 'Aarav Singh';
    final userRole = 'Researcher';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.bgDark : AppTheme.bgCanvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── 1. Top Header Row ─────────────────────────────────
              LayoutBuilder(
                builder: (context, constraints) {
                  final isDesktop = constraints.maxWidth >= 900;

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Text(
                              'Identify Wildlife Sound',
                              style: TextStyle(
                                fontSize: isDesktop ? 24 : 21,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : AppTheme.textDark,
                                letterSpacing: -0.5,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Model Online Live Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.mintBg.withValues(alpha: 0.25) : AppTheme.mintBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? AppTheme.mintBorder.withValues(alpha: 0.4) : AppTheme.mintBorder,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppTheme.green,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'Model Online',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : AppTheme.forestDark,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.cloud_outlined,
                                  size: 13,
                                  color: isDark ? Colors.white : AppTheme.forestDark,
                                ),
                              ],
                            ),
                          ),

                          if (isDesktop) ...[
                            const SizedBox(width: 14),
                            // User Profile Avatar
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 17,
                                  backgroundColor: AppTheme.forest,
                                  child: Text(
                                    user != null ? user.initials : 'AS',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      userName,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: isDark ? Colors.white : AppTheme.textDark,
                                      ),
                                    ),
                                    Text(
                                      userRole,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(
                            Icons.eco_outlined,
                            size: 13,
                            color: isDark ? AppTheme.greenLight : AppTheme.forest,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              'AI Species Classification & Analysis',
                              style: TextStyle(
                                fontSize: isDesktop ? 13 : 11.5,
                                fontWeight: FontWeight.w500,
                                color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),

              const SizedBox(height: 18),

              // ── 2. Top 4 KPI Metric Cards ─────────────────────────
              const TopStatCards(),

              const SizedBox(height: 18),

              // ── 3. Middle Dual Cards Layout ───────────────────────
              LayoutBuilder(
                builder: (context, constraints) {
                  if (constraints.maxWidth >= 900) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
                          child: _buildUploadCard(isDark, pred),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 1,
                          child: _buildPreviewCard(isDark, pred),
                        ),
                      ],
                    );
                  }

                  // Mobile vertical stack
                  return Column(
                    children: [
                      _buildUploadCard(isDark, pred),
                      const SizedBox(height: 16),
                      _buildPreviewCard(isDark, pred),
                    ],
                  );
                },
              ),

              const SizedBox(height: 18),

              // ── 4. Bottom 4 Quick-Stat Cards ──────────────────────
              const BottomStatusCards(),
            ],
          ),
        ),
      ),
    );
  }

  // ── Left Card: Upload Recording ────────────────────────────
  Widget _buildUploadCard(bool isDark, PredictionProvider pred) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.mintBg.withValues(alpha: 0.25) : AppTheme.mintBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.mintBorder),
                ),
                child: Icon(
                  Icons.cloud_upload_outlined,
                  size: 19,
                  color: isDark ? AppTheme.greenLight : AppTheme.forest,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Upload Recording',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Upload wildlife audio to identify species using AI.',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Dashed Dropzone
          GestureDetector(
            onTap: _pickFile,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF142419) : AppTheme.innerDropzoneBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppTheme.forestLight.withValues(alpha: 0.3) : const Color(0xFFD2E2D7),
                  width: 1.5,
                ),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Faded Waveform Watermark in Background
                  ClipRect(
                    child: Opacity(
                      opacity: isDark ? 0.08 : 0.12,
                      child: SizedBox(
                        height: 44,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(20, (i) {
                            final h = (math.sin(i * 0.35).abs() * 32) + 6;
                            return Container(
                              width: 3,
                              height: h,
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.forest,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            );
                          }),
                        ),
                      ),
                    ),
                  ),

                  // Center Content
                  Column(
                    children: [
                      // Upload Icon Circle
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.mintBg.withValues(alpha: 0.3) : AppTheme.mintBg,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.mintBorder),
                        ),
                        child: Icon(
                          Icons.arrow_upward_rounded,
                          size: 20,
                          color: isDark ? AppTheme.greenLight : AppTheme.forest,
                        ),
                      ),
                      const SizedBox(height: 10),

                      if (_selectedFilePath != null) ...[
                        Text(
                          _selectedFilePath!.split(Platform.pathSeparator).last,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDark,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Ready for AI classification',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.green,
                          ),
                        ),
                      ] else ...[
                        Text(
                          'Drag & drop your audio file here',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppTheme.textDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'WAV, MP3, OGG or FLAC • Max 50 MB',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.cardDark : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.cardBorder),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.folder_open_outlined,
                                size: 14,
                                color: isDark ? AppTheme.greenLight : AppTheme.forest,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Browse File',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : AppTheme.textDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 18),

          // Analyze Audio Button with Wave Icon
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: pred.isAnalyzing ? null : _analyze,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.forestButton,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              icon: pred.isAnalyzing
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.graphic_eq_rounded, size: 18),
              label: Text(
                pred.isAnalyzing ? 'Analyzing Audio...' : 'Analyze Audio',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Right Card: Analysis Preview (Updates In-Place) ─────────
  Widget _buildPreviewCard(bool isDark, PredictionProvider pred) {
    final result = pred.result;

    final commonName = result != null ? result.commonName : 'Brown-chested Martin';
    final sciName = result != null ? result.scientificName : 'Progne tapera';
    final animalClass = result != null ? result.animalClass : 'Aves';
    final status = result != null ? result.conservationStatus : 'Not assessed';
    final confidence = result != null ? result.confidence : 0.80;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.mintBg.withValues(alpha: 0.25) : AppTheme.mintBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.mintBorder),
                ),
                child: Icon(
                  Icons.graphic_eq_rounded,
                  size: 19,
                  color: isDark ? AppTheme.greenLight : AppTheme.forest,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Analysis Preview',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Preview and process audio for species identification.',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Green Waveform Multi-Bar
          ClipRect(
            child: SizedBox(
              height: 36,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(32, (i) {
                  final h = (math.sin(i * 0.22).abs() * math.cos(i * 0.08).abs() * 30) + 4;
                  final isPlayed = (i / 32) <= _sliderValue;
                  return Container(
                    width: 2.2,
                    height: h,
                    margin: const EdgeInsets.symmetric(horizontal: 1.2),
                    decoration: BoxDecoration(
                      color: isPlayed
                          ? AppTheme.forest
                          : (isDark ? AppTheme.forestLight.withValues(alpha: 0.35) : const Color(0xFFB8D5C1)),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  );
                }),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Audio Player Controls (Play button, 00:00, seek bar, 00:30)
          Row(
            children: [
              GestureDetector(
                onTap: () => setState(() => _isPlaying = !_isPlaying),
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: const BoxDecoration(
                    color: AppTheme.forest,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                '00:00',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                ),
              ),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 3,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 8),
                    activeTrackColor: AppTheme.forest,
                    inactiveTrackColor: isDark ? Colors.white12 : const Color(0xFFD4E5DA),
                    thumbColor: AppTheme.forest,
                  ),
                  child: Slider(
                    value: _sliderValue,
                    onChanged: (val) => setState(() => _sliderValue = val),
                  ),
                ),
              ),
              const Text(
                '00:30',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Noise Reduction & High Accuracy Badges
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildPillBadge(Icons.tune_rounded, 'Noise Reduction', isDark),
              _buildPillBadge(Icons.track_changes_rounded, 'High Accuracy', isDark),
            ],
          ),

          const SizedBox(height: 14),

          // Species Identified Banner (Rendered dynamically in-place)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF142419) : const Color(0xFFF0F7F2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : const Color(0xFFD8EADC),
              ),
            ),
            child: Row(
              children: [
                // Left Column (Species Details)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.green,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'Species Identified',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        commonName,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppTheme.textDark,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        sciName,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontStyle: FontStyle.italic,
                          color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),

                      // Class & Status Box
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Class',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  animalClass,
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white : AppTheme.textDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Status',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  status,
                                  style: const TextStyle(
                                    fontSize: 10.5,
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
                ),

                const SizedBox(width: 8),

                // Exact Circular Confidence Ring Gauge
                CircularConfidenceRing(
                  confidence: confidence,
                  size: 58,
                ),
              ],
            ),
          ),

          // ── Top 5 Prediction Breakdown (In-place from Web App) ──
          if (result != null && result.topKPredictions.isNotEmpty) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.bar_chart_rounded,
                      size: 14,
                      color: isDark ? AppTheme.greenLight : AppTheme.forest,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'TOP 5 PREDICTIONS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: isDark ? AppTheme.greenLight : AppTheme.forest,
                      ),
                    ),
                  ],
                ),
                Text(
                  'CONFIDENCE',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            ...result.topKPredictions.take(5).toList().asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              final isTop = idx == 0;
              final pct = (item.confidence * 100).toStringAsFixed(1);
              final barColor = isTop
                  ? AppTheme.forest
                  : (idx == 1 ? AppTheme.accentCyan : (idx == 2 ? AppTheme.blue : AppTheme.sage));

              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isTop
                      ? (isDark ? AppTheme.forest.withValues(alpha: 0.18) : AppTheme.mintBg)
                      : (isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF9FBFA)),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isTop ? AppTheme.mintBorder : const Color(0xFFE8F0EA),
                  ),
                ),
                child: Row(
                  children: [
                    // Rank Badge
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isTop ? AppTheme.forest : Colors.black12,
                      ),
                      child: Center(
                        child: Text(
                          '${idx + 1}',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isTop ? Colors.white : (isDark ? Colors.white70 : AppTheme.textMuted),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Label
                    SizedBox(
                      width: 90,
                      child: Text(
                        item.label,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: isTop ? FontWeight.w800 : FontWeight.w600,
                          color: isDark ? Colors.white : AppTheme.textDark,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // In-line Progress Track
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: item.confidence.clamp(0.02, 1.0),
                          minHeight: 5,
                          backgroundColor: isDark ? Colors.white10 : Colors.black12,
                          valueColor: AlwaysStoppedAnimation(barColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Percentage
                    Text(
                      '$pct%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        color: barColor,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],

          // ── Ecological Facts Matrix (Shown In-Place) ─────────────
          if (result != null && result.habitat != 'N/A' && result.habitat.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF142419) : const Color(0xFFF9FBFA),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.mintBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.forest_rounded, size: 14, color: AppTheme.forest),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Habitat: ${result.habitat}',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDark,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (result.diet != 'N/A' && result.diet.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.restaurant_rounded, size: 14, color: AppTheme.amber),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Diet: ${result.diet}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],

          // ── Acoustic Intelligence Spectrogram & Bioacoustics ─────
          if (result != null) ...[
            const SizedBox(height: 14),
            AcousticIntelligenceCard(result: result),
          ],
        ],
      ),
    );
  }

  Widget _buildPillBadge(IconData icon, String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.mintBg.withValues(alpha: 0.2) : AppTheme.mintBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.mintBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: isDark ? AppTheme.greenLight : AppTheme.forest),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
