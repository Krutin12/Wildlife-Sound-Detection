import 'dart:ui';
import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Full-screen frosted blur loading overlay with glowing bio-acoustic spinner.
class LoadingOverlay extends StatelessWidget {
  final String? message;

  const LoadingOverlay({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          color: Colors.black.withValues(alpha: 0.45),
          child: Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 40),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF112217) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _GlowSpinner(),
                  if (message != null) ...[
                    const SizedBox(height: 20),
                    Text(
                      message!,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GlowSpinner extends StatefulWidget {
  @override
  State<_GlowSpinner> createState() => _GlowSpinnerState();
}

class _GlowSpinnerState extends State<_GlowSpinner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Transform.rotate(
          angle: _controller.value * 6.28,
          child: Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.neonGradient,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryNeon.withValues(alpha: 0.4),
                  blurRadius: 16,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Center(
              child: Icon(
                Icons.eco_rounded,
                size: 28,
                color: Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }
}
