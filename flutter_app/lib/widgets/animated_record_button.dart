import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Futuristic Bio-Acoustic Sonar Record Trigger.
class AnimatedRecordButton extends StatefulWidget {
  final bool isRecording;
  final VoidCallback onTap;
  final double size;

  const AnimatedRecordButton({
    super.key,
    required this.isRecording,
    required this.onTap,
    this.size = 88,
  });

  @override
  State<AnimatedRecordButton> createState() => _AnimatedRecordButtonState();
}

class _AnimatedRecordButtonState extends State<AnimatedRecordButton>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _spinCtrl;
  late AnimationController _scaleCtrl;

  late Animation<double> _pulse1;
  late Animation<double> _pulse2;
  late Animation<double> _pulse3;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _pulse1 = Tween<double>(begin: 1.0, end: 1.6).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: const Interval(0.0, 0.7, curve: Curves.easeOutCubic)),
    );
    _pulse2 = Tween<double>(begin: 1.0, end: 1.4).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: const Interval(0.2, 0.9, curve: Curves.easeOutCubic)),
    );
    _pulse3 = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: const Interval(0.4, 1.0, curve: Curves.easeOutCubic)),
    );

    _spinCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();

    _scaleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 140),
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.90).animate(
      CurvedAnimation(parent: _scaleCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(AnimatedRecordButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isRecording) {
      _pulseCtrl.repeat();
    } else {
      _pulseCtrl.stop();
      _pulseCtrl.reset();
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _spinCtrl.dispose();
    _scaleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => _scaleCtrl.forward(),
      onTapUp: (_) {
        _scaleCtrl.reverse();
        widget.onTap();
      },
      onTapCancel: () => _scaleCtrl.reverse(),
      child: AnimatedBuilder(
        animation: Listenable.merge([_pulseCtrl, _spinCtrl, _scaleCtrl]),
        builder: (context, _) {
          return Transform.scale(
            scale: _scaleAnim.value,
            child: SizedBox(
              width: widget.size * 2.1,
              height: widget.size * 2.1,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer concentric pulse rings (only active when recording)
                  if (widget.isRecording) ...[
                    Transform.scale(
                      scale: _pulse1.value,
                      child: Container(
                        width: widget.size * 1.8,
                        height: widget.size * 1.8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.error.withValues(alpha: 0.10 * (1 - _pulseCtrl.value)),
                          border: Border.all(
                            color: AppTheme.error.withValues(alpha: 0.3 * (1 - _pulseCtrl.value)),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    Transform.scale(
                      scale: _pulse2.value,
                      child: Container(
                        width: widget.size * 1.5,
                        height: widget.size * 1.5,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.error.withValues(alpha: 0.16 * (1 - _pulseCtrl.value)),
                          border: Border.all(
                            color: AppTheme.error.withValues(alpha: 0.45 * (1 - _pulseCtrl.value)),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    Transform.scale(
                      scale: _pulse3.value,
                      child: Container(
                        width: widget.size * 1.25,
                        height: widget.size * 1.25,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.error.withValues(alpha: 0.22),
                        ),
                      ),
                    ),
                  ] else ...[
                    // Ambient radar ring when idle
                    Transform.rotate(
                      angle: _spinCtrl.value * 2 * math.pi,
                      child: Container(
                        width: widget.size * 1.45,
                        height: widget.size * 1.45,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark
                                ? AppTheme.primary.withValues(alpha: 0.25)
                                : AppTheme.primaryLight.withValues(alpha: 0.4),
                            width: 1.5,
                          ),
                        ),
                        child: Align(
                          alignment: Alignment.topCenter,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.primaryNeon,
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryNeon.withValues(alpha: 0.8),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],

                  // Core Record Button
                  Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: widget.isRecording
                            ? [const Color(0xFFEF4444), const Color(0xFFB91C1C)]
                            : [AppTheme.primaryLight, AppTheme.primaryDark],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (widget.isRecording ? AppTheme.error : AppTheme.primary)
                              .withValues(alpha: isDark ? 0.55 : 0.35),
                          blurRadius: 24,
                          spreadRadius: 3,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        widget.isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                        color: Colors.white,
                        size: widget.size * 0.46,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
