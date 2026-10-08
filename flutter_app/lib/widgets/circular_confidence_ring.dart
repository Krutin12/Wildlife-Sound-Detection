import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Exact Circular Confidence Ring Gauge (1:1 with Reference Screenshot).
class CircularConfidenceRing extends StatelessWidget {
  final double confidence; // 0.0 to 1.0
  final double size;

  const CircularConfidenceRing({
    super.key,
    required this.confidence,
    this.size = 76,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final percent = (confidence * 100).round();
    final arcColor = confidence >= 0.75
        ? AppTheme.green
        : (confidence >= 0.45 ? AppTheme.amber : AppTheme.rose);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Track & Arc
          CustomPaint(
            size: Size(size, size),
            painter: _RingPainter(
              progress: confidence.clamp(0.0, 1.0),
              arcColor: arcColor,
              trackColor: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : const Color(0xFFE2ECE5),
              strokeWidth: 5.5,
            ),
          ),

          // Percentage Text in Center
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '$percent%',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.textDark,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Confidence',
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final Color arcColor;
  final Color trackColor;
  final double strokeWidth;

  _RingPainter({
    required this.progress,
    required this.arcColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    // Foreground progress arc
    final arcPaint = Paint()
      ..color = arcColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.arcColor != arcColor;
}
