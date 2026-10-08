import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_text_field.dart';

/// User Profile Editor.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _firstNameCtrl = TextEditingController(text: user?.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: user?.lastName ?? '');
    _emailCtrl = TextEditingController(text: user?.email ?? '');
    _phoneCtrl = TextEditingController(text: user?.phoneNumber ?? '');
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final success = await auth.updateProfile(
      firstName: _firstNameCtrl.text.trim(),
      lastName: _lastNameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      phoneNumber: _phoneCtrl.text.trim(),
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success ? 'Profile updated successfully' : (auth.errorMessage ?? 'Update failed')),
        backgroundColor: success ? AppTheme.success : AppTheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: Container(
        decoration: BoxDecoration(
          gradient: isDark ? AppTheme.darkMeshGradient : null,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Avatar
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppTheme.neonGradient,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryNeon.withValues(alpha: 0.3),
                      blurRadius: 20,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    auth.user?.initials ?? '??',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF022C22),
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '@${auth.user?.username ?? ''}',
                style: TextStyle(
                  color: isDark ? AppTheme.primaryNeon : AppTheme.primaryDark,
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 28),

              // Form Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF14261B) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: CustomTextField(
                              controller: _firstNameCtrl,
                              labelText: 'First Name',
                              prefixIcon: Icons.person_outline_rounded,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CustomTextField(
                              controller: _lastNameCtrl,
                              labelText: 'Last Name',
                              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: _emailCtrl,
                        labelText: 'Email Address',
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Required';
                          if (!v.contains('@')) return 'Invalid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      CustomTextField(
                        controller: _phoneCtrl,
                        labelText: 'Phone Number (10 digits)',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Required';
                          if (!RegExp(r'^\d{10}$').hasMatch(v.trim())) {
                            return 'Must be 10 digits';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 28),

                      // Save Button
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          onPressed: auth.isLoading ? null : _save,
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
                                  'SAVE PROFILE CHANGES',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                      ),
                    ],
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
