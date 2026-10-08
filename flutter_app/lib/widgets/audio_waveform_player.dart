import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Audio Waveform Player with real-time seek track (1:1 with React AnalysisPreview.tsx).
class AudioWaveformPlayer extends StatefulWidget {
  final File? audioFile;

  const AudioWaveformPlayer({super.key, this.audioFile});

  @override
  State<AudioWaveformPlayer> createState() => _AudioWaveformPlayerState();
}

class _AudioWaveformPlayerState extends State<AudioWaveformPlayer> {
  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;
  Duration _currentPos = Duration.zero;
  Duration _duration = Duration.zero;
  late final List<double> _waveformHeights;
  StreamSubscription? _posSub;
  StreamSubscription? _durSub;
  StreamSubscription? _stateSub;

  @override
  void initState() {
    super.initState();
    // Generate organic waveform bars like web app
    final rand = math.Random(42);
    _waveformHeights = List.generate(
      48,
      (i) => (math.sin(i * 0.22).abs() * math.cos(i * 0.08).abs() * 38) + (rand.nextDouble() * 12) + 6,
    );

    _posSub = _player.onPositionChanged.listen((pos) {
      if (mounted) setState(() => _currentPos = pos);
    });
    _durSub = _player.onDurationChanged.listen((dur) {
      if (mounted) setState(() => _duration = dur);
    });
    _stateSub = _player.onPlayerStateChanged.listen((state) {
      if (mounted) setState(() => _isPlaying = state == PlayerState.playing);
    });
  }

  @override
  void didUpdateWidget(AudioWaveformPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.audioFile != oldWidget.audioFile && widget.audioFile != null) {
      _player.stop();
      _currentPos = Duration.zero;
      _player.setSource(DeviceFileSource(widget.audioFile!.path));
    }
  }

  @override
  void dispose() {
    _posSub?.cancel();
    _durSub?.cancel();
    _stateSub?.cancel();
    _player.dispose();
    super.dispose();
  }

  String _formatTime(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _togglePlay() async {
    if (widget.audioFile == null) return;
    if (_isPlaying) {
      await _player.pause();
    } else {
      await _player.play(DeviceFileSource(widget.audioFile!.path));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = _duration.inMilliseconds > 0
        ? (_currentPos.inMilliseconds / _duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1B3122) : const Color(0xFFF9FBFA),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppTheme.forestLight.withValues(alpha: 0.2)
                      : AppTheme.mintBg,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark
                        ? AppTheme.forestLight.withValues(alpha: 0.35)
                        : AppTheme.mintBorder,
                  ),
                ),
                child: Icon(
                  Icons.graphic_eq_rounded,
                  size: 16,
                  color: isDark ? AppTheme.forestLight : AppTheme.forest,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Audio Spectral Waveform',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Decoded bio-acoustic amplitude',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Multi-Bar Waveform Visualization
          SizedBox(
            height: 50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: List.generate(_waveformHeights.length, (i) {
                final barPct = i / _waveformHeights.length;
                final isPlayed = barPct <= progress;
                final height = _waveformHeights[i];

                return Container(
                  width: 3,
                  height: height,
                  decoration: BoxDecoration(
                    color: isPlayed
                        ? (isDark ? AppTheme.greenLight : AppTheme.forest)
                        : (isDark ? AppTheme.forest.withValues(alpha: 0.35) : AppTheme.forestLight.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
            ),
          ),

          const SizedBox(height: 10),

          // Player Controls Row
          Row(
            children: [
              // Play/Pause Button
              GestureDetector(
                onTap: widget.audioFile != null ? _togglePlay : null,
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: widget.audioFile != null ? AppTheme.forestDark : Colors.grey,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.forestDark.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),

              const SizedBox(width: 10),

              // Current Time
              Text(
                _formatTime(_currentPos),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                ),
              ),

              const SizedBox(width: 8),

              // Seek Bar Track
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 4,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                    activeTrackColor: isDark ? AppTheme.forestLight : AppTheme.forest,
                    inactiveTrackColor: isDark ? Colors.white12 : Colors.black12,
                    thumbColor: isDark ? AppTheme.greenLight : AppTheme.forestDark,
                  ),
                  child: Slider(
                    value: progress,
                    onChanged: (val) {
                      if (_duration.inMilliseconds > 0) {
                        final newPos = Duration(milliseconds: (val * _duration.inMilliseconds).toInt());
                        _player.seek(newPos);
                      }
                    },
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Total Duration
              Text(
                _formatTime(_duration),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                  color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Noise Reduction & High Accuracy Badges
          Wrap(
            spacing: 8,
            children: [
              _buildBadge(Icons.tune_rounded, 'Noise Reduction Active', isDark),
              _buildBadge(Icons.auto_awesome_rounded, 'Bio-Acoustic HD Filter', isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(IconData icon, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isDark
            ? AppTheme.forestLight.withValues(alpha: 0.15)
            : AppTheme.mintBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark
              ? AppTheme.forestLight.withValues(alpha: 0.3)
              : AppTheme.mintBorder,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: isDark ? AppTheme.greenLight : AppTheme.forest),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isDark ? AppTheme.textLightPrimary : AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }
}
