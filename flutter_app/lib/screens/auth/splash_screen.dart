import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';

/// Animated splash screen — checks for saved session with glowing ambient flora aesthetic.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.65, curve: Curves.easeOut)),
    );
    _scaleAnimation = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.7, curve: Curves.easeOutBack)),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.85, curve: Curves.easeOutCubic)),
    );

    _controller.forward();
    Future.delayed(const Duration(milliseconds: 2200), _checkSessionAndNavigate);
  }

  Future<void> _checkSessionAndNavigate() async {
    if (!mounted) return;
    final authProvider = context.read<AuthProvider>();
    final hasSession = await authProvider.loadSavedSession();

    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed(
      hasSession ? AppRouter.home : AppRouter.login,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF03160D),
              Color(0xFF072416),
              Color(0xFF04140B),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Glowing Animated Logo Box
              AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  return Opacity(
                    opacity: _fadeAnimation.value,
                    child: Transform.scale(
                      scale: _scaleAnimation.value,
                      child: Image.asset(
                        'assets/images/logo.png',
                        width: 130,
                        height: 130,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.eco_rounded,
                          size: 90,
                          color: AppTheme.greenLight,
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),

              // Brand Title & Tagline
              SlideTransition(
                position: _slideAnimation,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    children: [
                      Text(
                        'ListenLeaf',
                        style: GoogleFonts.outfit(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          'BIO-ACOUSTIC WILDLIFE INTELLIGENCE',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryNeon,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 52),

              // Glowing Minimal Progress
              FadeTransition(
                opacity: _fadeAnimation,
                child: const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation(AppTheme.primaryNeon),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
