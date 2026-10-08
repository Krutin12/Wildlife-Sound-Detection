import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text_field.dart';

/// Next-Gen Bio-Acoustic Auth Portal.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  late AnimationController _animCtrl;
  late Animation<Offset> _slideAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    _fadeAnim = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final result = await auth.login(
      username: _usernameCtrl.text.trim(),
      password: _passwordCtrl.text,
    );

    if (!mounted) return;

    switch (result) {
      case 'success':
        Navigator.of(context).pushReplacementNamed(AppRouter.home);
        break;
      case 'requires_2fa':
        Navigator.of(context).pushNamed(AppRouter.otpVerify, arguments: {
          'challengeId': auth.challengeId,
          'maskedDestination': auth.maskedDestination,
          'method': auth.challengeMethod,
        });
        break;
      case 'error':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage ?? 'Authentication failed.'),
            backgroundColor: AppTheme.error,
          ),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: isDark
              ? const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF04190E), Color(0xFF08100B)],
                )
              : const LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFFE8F5E9), Color(0xFFF4F9F4)],
                ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: SlideTransition(
                position: _slideAnim,
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),

                      // Brand Logo
                      Image.asset(
                        'assets/images/logo.png',
                        width: 80,
                        height: 80,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.eco_rounded,
                          size: 56,
                          color: AppTheme.forest,
                        ),
                      ),
                      const SizedBox(height: 18),

                      Text(
                        'Welcome Back',
                        style: GoogleFonts.outfit(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Sign in to access bio-acoustic tools & field logs',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 32),

                      // Auth Glass Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF122318) : Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isDark
                                  ? Colors.black.withValues(alpha: 0.3)
                                  : AppTheme.primaryDark.withValues(alpha: 0.05),
                              blurRadius: 28,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              CustomTextField(
                                controller: _usernameCtrl,
                                labelText: 'Username',
                                prefixIcon: Icons.alternate_email_rounded,
                                textInputAction: TextInputAction.next,
                                validator: (val) {
                                  if (val == null || val.trim().isEmpty) {
                                    return 'Please enter your username';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              CustomTextField(
                                controller: _passwordCtrl,
                                labelText: 'Password',
                                prefixIcon: Icons.lock_outline_rounded,
                                obscureText: _obscurePassword,
                                textInputAction: TextInputAction.done,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                      () => _obscurePassword = !_obscurePassword),
                                ),
                                validator: (val) {
                                  if (val == null || val.isEmpty) {
                                    return 'Please enter your password';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 28),

                              // Gradient Sign-In CTA Button
                              Consumer<AuthProvider>(
                                builder: (_, auth, _) {
                                  return Container(
                                    width: double.infinity,
                                    height: 54,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(18),
                                      gradient: AppTheme.primaryGradient,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppTheme.primary.withValues(alpha: 0.3),
                                          blurRadius: 18,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: ElevatedButton(
                                      onPressed: auth.isLoading ? null : _handleLogin,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        foregroundColor: Colors.white,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(18),
                                        ),
                                      ),
                                      child: auth.isLoading
                                          ? const SizedBox(
                                              width: 22,
                                              height: 22,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.5,
                                                color: Colors.white,
                                              ),
                                            )
                                          : const Text(
                                              'SIGN IN',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 28),

                      // Register Link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "New to ListenLeaf? ",
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          GestureDetector(
                            onTap: () => Navigator.of(context).pushNamed(AppRouter.register),
                            child: Text(
                              'Create Account',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
