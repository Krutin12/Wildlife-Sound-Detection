import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';

/// 2FA OTP security verification screen with auto-focus boxes.
class OtpVerificationScreen extends StatefulWidget {
  final String challengeId;
  final String maskedDestination;
  final String method;

  const OtpVerificationScreen({
    super.key,
    required this.challengeId,
    required this.maskedDestination,
    required this.method,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  int _resendCooldown = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startCooldown() {
    _resendCooldown = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendCooldown <= 0) {
        t.cancel();
      } else {
        setState(() => _resendCooldown--);
      }
    });
  }

  String get _otpCode => _controllers.map((c) => c.text).join();

  Future<void> _verify() async {
    final code = _otpCode;
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the full 6-digit security code')),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.verifyOtp(code);

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pushNamedAndRemoveUntil(
        AppRouter.home,
        (route) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage ?? 'Invalid verification code'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  Future<void> _resend() async {
    if (_resendCooldown > 0) return;
    final auth = context.read<AuthProvider>();
    final sent = await auth.resendOtp();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(sent ? 'Verification code resent' : 'Failed to resend code'),
          backgroundColor: sent ? AppTheme.success : AppTheme.error,
        ),
      );
      if (sent) _startCooldown();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('2FA Security Check'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 28),

              // Shield Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (isDark ? AppTheme.primaryDeep : AppTheme.primarySoft)
                      .withValues(alpha: 0.35),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.verified_user_rounded,
                    size: 38,
                    color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'Enter Security Code',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'We sent a 6-digit one-time passcode to:\n${widget.maskedDestination}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      height: 1.4,
                    ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 36),

              // 6-Pin Input Boxes
              Row(
                children: List.generate(6, (i) {
                  return Expanded(
                    child: Container(
                      height: 58,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      child: TextField(
                        controller: _controllers[i],
                        focusNode: _focusNodes[i],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        maxLength: 1,
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                        ),
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          counterText: '',
                          contentPadding: EdgeInsets.zero,
                          filled: true,
                          fillColor: isDark ? const Color(0xFF14261B) : Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                            ),
                          ),
                        ),
                        onChanged: (val) {
                          if (val.isNotEmpty && i < 5) {
                            _focusNodes[i + 1].requestFocus();
                          } else if (val.isEmpty && i > 0) {
                            _focusNodes[i - 1].requestFocus();
                          }
                          if (_otpCode.length == 6) {
                            _verify();
                          }
                        },
                      ),
                    ),
                  );
                }),
              ),

              const SizedBox(height: 36),

              // Submit Button
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
                      onPressed: auth.isLoading ? null : _verify,
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
                              'VERIFY PASSCODE',
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

              const SizedBox(height: 20),

              // Resend Action
              TextButton(
                onPressed: _resendCooldown > 0 ? null : _resend,
                child: Text(
                  _resendCooldown > 0
                      ? 'Resend code in ${_resendCooldown}s'
                      : 'Resend Passcode',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: _resendCooldown > 0
                        ? (isDark ? AppTheme.textLightHint : AppTheme.textDarkHint)
                        : (isDark ? AppTheme.primaryNeon : AppTheme.primaryDark),
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
