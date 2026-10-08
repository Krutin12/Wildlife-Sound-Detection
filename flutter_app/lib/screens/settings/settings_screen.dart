import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_constants.dart';
import '../../config/app_router.dart';
import '../../config/app_theme.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/edit_profile_dialog.dart';

/// 3-Tab Settings & Profile Screen matching Settings.tsx (Profile, Appearance, Security).
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  int _activeSubTab = 0; // 0 = Profile, 1 = Appearance, 2 = Security

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();
    final theme = context.watch<ThemeProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.bgDark : AppTheme.bgCanvas,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Title Row
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Settings & Preferences',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Account Profile, Appearance & System Security',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            // 3-SubTab Switcher: Profile | Appearance | Security
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.cardDark : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTabButton('Profile', Icons.person_outline_rounded, 0, isDark),
                    ),
                    Expanded(
                      child: _buildTabButton('Appearance', Icons.palette_outlined, 1, isDark),
                    ),
                    Expanded(
                      child: _buildTabButton('Security', Icons.shield_outlined, 2, isDark),
                    ),
                  ],
                ),
              ),
            ),

            // Tab Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  if (_activeSubTab == 0) _buildProfileTab(context, user, isDark),
                  if (_activeSubTab == 1) _buildAppearanceTab(context, theme, isDark),
                  if (_activeSubTab == 2) _buildSecurityTab(context, auth, isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, IconData icon, int index, bool isDark) {
    final isSelected = _activeSubTab == index;
    return GestureDetector(
      onTap: () => setState(() => _activeSubTab = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.forest : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? Colors.white : (isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : (isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Tab 1: Profile Subtab ──────────────────────────────────
  Widget _buildProfileTab(BuildContext context, User? user, bool isDark) {
    return EditProfileDialog(user: user, isDialog: false);
  }

  // ── Tab 2: Appearance Subtab ───────────────────────────────
  Widget _buildAppearanceTab(BuildContext context, ThemeProvider theme, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
          width: 1.2,
        ),
      ),
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('Obsidian Dark Mode', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            subtitle: Text(
              theme.isDarkMode ? 'Luxury dark forest theme active' : 'Light botanical theme active',
              style: const TextStyle(fontSize: 11.5),
            ),
            secondary: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.mintBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                theme.isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                color: AppTheme.forest,
                size: 20,
              ),
            ),
            value: theme.isDarkMode,
            activeTrackColor: AppTheme.forest,
            activeThumbColor: AppTheme.greenLight,
            onChanged: (_) => theme.toggleTheme(),
          ),
          const Divider(height: 1),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.mintBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.palette_outlined, color: AppTheme.forest, size: 20),
            ),
            title: const Text('Primary Accent Theme', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
            subtitle: const Text('Forest Emerald (#3D6B4F)', style: TextStyle(fontSize: 11.5)),
            trailing: Container(
              width: 22,
              height: 22,
              decoration: const BoxDecoration(color: AppTheme.forest, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
  }

  // ── Tab 3: Security Subtab ─────────────────────────────────
  Widget _buildSecurityTab(BuildContext context, AuthProvider auth, bool isDark) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
              width: 1.2,
            ),
          ),
          child: Column(
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.green.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.security_rounded, color: AppTheme.green, size: 20),
                ),
                title: const Text('2-Factor Authentication (2FA)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                subtitle: const Text('Email & SMS OTP verification active', style: TextStyle(fontSize: 11.5)),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.mintBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('ACTIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.green)),
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF06B6D4).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.dns_rounded, color: Color(0xFF06B6D4), size: 20),
                ),
                title: const Text('FastAPI Server Endpoint', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                subtitle: Text(ApiService().currentBaseUrl, style: const TextStyle(fontSize: 11.5)),
                trailing: const Icon(Icons.edit_rounded, size: 16),
                onTap: () => _showServerUrlDialog(context),
              ),
              const Divider(height: 1),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.forest.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.memory_rounded, color: AppTheme.forest, size: 20),
                ),
                title: const Text('AI Inference Engine', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                subtitle: Text('PyTorch EfficientNet-B3 • v${AppConstants.appVersion}', style: const TextStyle(fontSize: 11.5)),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Logout Action Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: OutlinedButton.icon(
            onPressed: () => _confirmLogout(context),
            icon: const Icon(Icons.logout_rounded, color: AppTheme.rose, size: 18),
            label: const Text('LOG OUT CURRENT SESSION', style: TextStyle(color: AppTheme.rose, fontWeight: FontWeight.w800)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.rose, width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ],
    );
  }


  void _showServerUrlDialog(BuildContext context) {
    final controller = TextEditingController(text: ApiService().currentBaseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('FastAPI Server Endpoint'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'http://192.168.x.x:8000',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ApiService().updateBaseUrl(controller.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Server endpoint updated')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to end your current session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthProvider>().logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                AppRouter.login,
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
