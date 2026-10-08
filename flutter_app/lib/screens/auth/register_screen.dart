import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text_field.dart';

/// Next-Gen Registration Screen with password strength meter.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  double _passwordStrength(String pwd) {
    if (pwd.isEmpty) return 0;
    double strength = 0;
    if (pwd.length >= 8) strength += 0.2;
    if (pwd.length >= 12) strength += 0.1;
    if (RegExp(r'[A-Z]').hasMatch(pwd)) strength += 0.2;
    if (RegExp(r'[a-z]').hasMatch(pwd)) strength += 0.1;
    if (RegExp(r'[0-9]').hasMatch(pwd)) strength += 0.2;
    if (RegExp(r'[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?]').hasMatch(pwd)) {
      strength += 0.2;
    }
    return strength.clamp(0, 1);
  }

  Color _strengthColor(double strength) {
    if (strength < 0.3) return AppTheme.error;
    if (strength < 0.6) return AppTheme.warning;
    if (strength < 0.8) return AppTheme.secondary;
    return AppTheme.primaryNeon;
  }

  String _strengthLabel(double strength) {
    if (strength < 0.3) return 'Weak';
    if (strength < 0.6) return 'Fair';
    if (strength < 0.8) return 'Good';
    return 'Strong';
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final success = await auth.register(
      firstName: _firstNameCtrl.text.trim(),
      lastName: _lastNameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      username: _usernameCtrl.text.trim(),
      password: _passwordCtrl.text,
      phoneNumber: _phoneCtrl.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushReplacementNamed(AppRouter.home);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage ?? 'Registration failed'),
          backgroundColor: AppTheme.error,
        ),
      );
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 16),

                // Back Button & Title Header
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Create Account',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Form Card
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
                        // Name Row
                        Row(
                          children: [
                            Expanded(
                              child: CustomTextField(
                                controller: _firstNameCtrl,
                                labelText: 'First Name',
                                prefixIcon: Icons.person_outline_rounded,
                                textInputAction: TextInputAction.next,
                                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: CustomTextField(
                                controller: _lastNameCtrl,
                                labelText: 'Last Name',
                                textInputAction: TextInputAction.next,
                                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        CustomTextField(
                          controller: _emailCtrl,
                          labelText: 'Email Address',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Please enter your email';
                            if (!v.contains('@') || !v.contains('.')) return 'Invalid email address';
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        CustomTextField(
                          controller: _usernameCtrl,
                          labelText: 'Username',
                          prefixIcon: Icons.alternate_email_rounded,
                          textInputAction: TextInputAction.next,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Please enter a username';
                            if (v.trim().length < 3) return 'Must be at least 3 characters';
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        CustomTextField(
                          controller: _phoneCtrl,
                          labelText: 'Phone Number (10 digits)',
                          prefixIcon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Please enter your phone number';
                            if (!RegExp(r'^\d{10}$').hasMatch(v.trim())) {
                              return 'Must be exactly 10 digits';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        CustomTextField(
                          controller: _passwordCtrl,
                          labelText: 'Password',
                          prefixIcon: Icons.lock_outline_rounded,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onChanged: (_) => setState(() {}),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 20,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Please enter a password';
                            if (v.length < 8) return 'Must be at least 8 characters';
                            if (!RegExp(r'[A-Z]').hasMatch(v)) return 'Must contain an uppercase letter';
                            if (!RegExp(r'[a-z]').hasMatch(v)) return 'Must contain a lowercase letter';
                            if (!RegExp(r'[0-9]').hasMatch(v)) return 'Must contain a digit';
                            if (!RegExp(r'[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>/?]').hasMatch(v)) {
                              return 'Must contain a special character';
                            }
                            return null;
                          },
                        ),

                        // Password Strength Bar
                        if (_passwordCtrl.text.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Builder(builder: (_) {
                            final s = _passwordStrength(_passwordCtrl.text);
                            final color = _strengthColor(s);
                            return Row(
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: s,
                                      minHeight: 5,
                                      backgroundColor: color.withValues(alpha: 0.15),
                                      valueColor: AlwaysStoppedAnimation(color),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  _strengthLabel(s),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: color,
                                  ),
                                ),
                              ],
                            );
                          }),
                        ],

                        const SizedBox(height: 28),

                        // Gradient Submit CTA Button
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
                                onPressed: auth.isLoading ? null : _handleRegister,
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
                                        'CREATE ACCOUNT',
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

                const SizedBox(height: 24),

                // Sign In Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already registered? ',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
