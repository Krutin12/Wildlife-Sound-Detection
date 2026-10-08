import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../config/app_theme.dart';
import '../models/user_model.dart';
import '../providers/auth_provider.dart';

/// Modern, professional SaaS-style Account Profile Editor Widget / Dialog.
class EditProfileDialog extends StatefulWidget {
  final User? user;
  final bool isDialog;

  const EditProfileDialog({
    super.key,
    this.user,
    this.isDialog = false,
  });

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _displayNameCtrl;
  late TextEditingController _usernameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _aboutCtrl;

  String? _photoPath;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final u = widget.user;
    _firstNameCtrl = TextEditingController(text: u?.firstName ?? 'Aarav');
    _lastNameCtrl = TextEditingController(text: u?.lastName ?? 'Singh');
    _displayNameCtrl = TextEditingController(
      text: (u != null && u.fullName.isNotEmpty) ? u.fullName : 'Aarav Singh',
    );
    _usernameCtrl = TextEditingController(text: u?.username ?? 'aarav_wild');
    _emailCtrl = TextEditingController(text: u?.email ?? 'aarav.singh@wildsound.ai');
    _phoneCtrl = TextEditingController(text: u?.phoneNumber ?? '9876543210');
    _aboutCtrl = TextEditingController(
      text: 'Wildlife bioacoustics researcher studying avian vocalizations and ecological patterns in field habitats.',
    );
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _displayNameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _aboutCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      if (result != null && result.files.single.path != null) {
        setState(() {
          _photoPath = result.files.single.path;
        });
      }
    } catch (_) {
      // User cancelled or platform error
    }
  }

  void _removePhoto() {
    setState(() {
      _photoPath = null;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final auth = context.read<AuthProvider>();
      if (widget.user != null) {
        await auth.updateProfile(
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          phoneNumber: _phoneCtrl.text.trim(),
        );
      }

      if (mounted) {
        if (widget.isDialog) {
          Navigator.pop(context);
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Account profile updated successfully!'),
            backgroundColor: AppTheme.forest,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: AppTheme.rose,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _cancel() {
    if (widget.isDialog) {
      Navigator.pop(context);
    } else {
      final u = widget.user;
      setState(() {
        _firstNameCtrl.text = u?.firstName ?? 'Aarav';
        _lastNameCtrl.text = u?.lastName ?? 'Singh';
        _displayNameCtrl.text = (u != null && u.fullName.isNotEmpty) ? u.fullName : 'Aarav Singh';
        _usernameCtrl.text = u?.username ?? 'aarav_wild';
        _emailCtrl.text = u?.email ?? 'aarav.singh@wildsound.ai';
        _phoneCtrl.text = u?.phoneNumber ?? '9876543210';
        _aboutCtrl.text = 'Wildlife bioacoustics researcher studying avian vocalizations and ecological patterns in field habitats.';
        _photoPath = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile form reset'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showChangePasswordModal() {
    final currentPwCtrl = TextEditingController();
    final newPwCtrl = TextEditingController();
    final confirmPwCtrl = TextEditingController();
    final pwFormKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Change Password',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppTheme.textDark,
              fontSize: 18,
            ),
          ),
          content: Form(
            key: pwFormKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: currentPwCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Current Password'),
                  validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: newPwCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'New Password (min 6 chars)'),
                  validator: (v) => (v != null && v.length >= 6) ? null : 'Min 6 characters',
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: confirmPwCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirm New Password'),
                  validator: (v) => (v == newPwCtrl.text) ? null : 'Passwords do not match',
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (pwFormKey.currentState!.validate()) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password changed successfully!'),
                      backgroundColor: AppTheme.forest,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.forest,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Update Password'),
            ),
          ],
        );
      },
    );
  }

  void _showNotificationPrefsModal() {
    bool emailAlerts = true;
    bool soundReports = true;
    bool speciesSync = true;

    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                'Notification Preferences',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDark,
                  fontSize: 18,
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SwitchListTile(
                    title: const Text('Email Classification Alerts', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Receive digest for identified species', style: TextStyle(fontSize: 11)),
                    value: emailAlerts,
                    activeThumbColor: AppTheme.forest,
                    onChanged: (v) => setModalState(() => emailAlerts = v),
                  ),
                  SwitchListTile(
                    title: const Text('Bioacoustic Report Exports', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Weekly audio analysis summaries', style: TextStyle(fontSize: 11)),
                    value: soundReports,
                    activeThumbColor: AppTheme.forest,
                    onChanged: (v) => setModalState(() => soundReports = v),
                  ),
                  SwitchListTile(
                    title: const Text('Database Synchronizations', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Offline species library sync notices', style: TextStyle(fontSize: 11)),
                    value: speciesSync,
                    activeThumbColor: AppTheme.forest,
                    onChanged: (v) => setModalState(() => speciesSync = v),
                  ),
                ],
              ),
              actions: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Notification preferences saved!'),
                        backgroundColor: AppTheme.forest,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.forest,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Save Preferences'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final initials = widget.user != null && widget.user!.fullName.isNotEmpty
        ? widget.user!.initials
        : 'AS';

    final contentWidget = Container(
      width: double.infinity,
      constraints: widget.isDialog
          ? BoxConstraints(
              maxWidth: 540,
              maxHeight: MediaQuery.of(context).size.height * 0.90,
            )
          : null,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : const Color(0xFFD6E6DC),
          width: 1.2,
        ),
        boxShadow: widget.isDialog
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                ),
              ]
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Modal / Card Header ──────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 18, 14, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Edit Account Profile',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                          color: isDark ? Colors.white : AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Update your personal information and security settings',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (widget.isDialog)
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    tooltip: 'Close',
                    onPressed: () => Navigator.pop(context),
                  ),
              ],
            ),
          ),

          const Divider(height: 1),

          // ── Form Body ─────────────────────────────────────────
          widget.isDialog
              ? Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(22, 16, 22, 16),
                    child: _buildForm(context, isDark, initials),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.fromLTRB(22, 16, 22, 16),
                  child: _buildForm(context, isDark, initials),
                ),

          const Divider(height: 1),

          // ── Footer Actions ─────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: _isSaving ? null : _cancel,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    foregroundColor: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.forest,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppTheme.forest.withValues(alpha: 0.6),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Saving...',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                            ),
                          ],
                        )
                      : const Text(
                          'Save Profile',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    if (widget.isDialog) {
      return Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: contentWidget,
      );
    }

    return contentWidget;
  }

  Widget _buildForm(BuildContext context, bool isDark, String initials) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
                      // ── 1. Circular Profile Photo Section ──────────
                      Center(
                        child: Column(
                          children: [
                            Container(
                              width: 84,
                              height: 84,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isDark ? const Color(0xFF1B3524) : AppTheme.mintBg,
                                border: Border.all(
                                  color: AppTheme.forest.withValues(alpha: 0.5),
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.forest.withValues(alpha: 0.15),
                                    blurRadius: 12,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: _photoPath != null
                                    ? Image.file(
                                        File(_photoPath!),
                                        width: 84,
                                        height: 84,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Center(
                                          child: Text(
                                            initials,
                                            style: const TextStyle(
                                              fontSize: 26,
                                              fontWeight: FontWeight.w900,
                                              color: AppTheme.forest,
                                            ),
                                          ),
                                        ),
                                      )
                                    : Center(
                                        child: Text(
                                          initials,
                                          style: TextStyle(
                                            fontSize: 26,
                                            fontWeight: FontWeight.w900,
                                            color: isDark ? AppTheme.greenLight : AppTheme.forest,
                                          ),
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _pickPhoto,
                                  icon: const Icon(Icons.camera_alt_outlined, size: 14),
                                  label: const Text(
                                    'Change Photo',
                                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    side: BorderSide(
                                      color: isDark ? AppTheme.borderDark : const Color(0xFFD6E6DC),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                                if (_photoPath != null) ...[
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: _removePhoto,
                                    style: TextButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                      foregroundColor: AppTheme.rose,
                                    ),
                                    child: const Text(
                                      'Remove',
                                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 18),

                      // ── 2. First Name & Last Name (Side by Side) ──
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildFormField(
                              label: 'First Name',
                              controller: _firstNameCtrl,
                              placeholder: 'Enter first name',
                              isDark: isDark,
                              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildFormField(
                              label: 'Last Name',
                              controller: _lastNameCtrl,
                              placeholder: 'Enter last name',
                              isDark: isDark,
                              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // ── 3. Display Name (Full-width) ──────────────
                      _buildFormField(
                        label: 'Display Name',
                        controller: _displayNameCtrl,
                        placeholder: 'Enter display name',
                        isDark: isDark,
                      ),

                      const SizedBox(height: 14),

                      // ── 4. Username (Full-width) ──────────────────
                      _buildFormField(
                        label: 'Username',
                        controller: _usernameCtrl,
                        placeholder: 'Enter username',
                        prefixIcon: Icons.alternate_email_rounded,
                        isDark: isDark,
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                      ),

                      const SizedBox(height: 14),

                      // ── 5. Email Address (Full-width) ─────────────
                      _buildFormField(
                        label: 'Email Address',
                        controller: _emailCtrl,
                        placeholder: 'Enter email address',
                        prefixIcon: Icons.mail_outline_rounded,
                        keyboardType: TextInputType.emailAddress,
                        isDark: isDark,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Required';
                          if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
                          return null;
                        },
                      ),

                      const SizedBox(height: 14),

                      // ── 6. 10-Digit Phone Number (Full-width) ─────
                      _buildFormField(
                        label: 'Phone Number',
                        controller: _phoneCtrl,
                        placeholder: 'Enter 10-digit phone number',
                        prefixIcon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        isDark: isDark,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Required';
                          final clean = v.replaceAll(RegExp(r'\D'), '');
                          if (clean.length != 10) return 'Must be exactly 10 digits';
                          return null;
                        },
                      ),

                      const SizedBox(height: 14),

                      // ── 7. About Me (Multiline with Counter) ──────
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'About Me',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
                                ),
                              ),
                              ValueListenableBuilder<TextEditingValue>(
                                valueListenable: _aboutCtrl,
                                builder: (context, value, _) {
                                  return Text(
                                    '${value.text.length}/240',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      color: value.text.length > 240
                                          ? AppTheme.rose
                                          : (isDark ? AppTheme.textLightHint : AppTheme.textMuted),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _aboutCtrl,
                            maxLines: 3,
                            minLines: 3,
                            maxLength: 240,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white : AppTheme.textDark,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Tell us something about yourself...',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                              ),
                              counterText: '',
                              filled: true,
                              fillColor: isDark ? const Color(0xFF142419) : Colors.white,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: isDark ? AppTheme.borderDark : const Color(0xFFD6E6DC),
                                  width: 1.1,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppTheme.forest,
                                  width: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 22),

                      // ── 8. Account & Security Section ─────────────
                      Text(
                        'Account & Security',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                          color: isDark ? Colors.white : AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 8),

                      Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF142419) : const Color(0xFFF9FBFA),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isDark ? AppTheme.borderDark : const Color(0xFFD6E6DC),
                            width: 1.1,
                          ),
                        ),
                        child: Column(
                          children: [
                            _buildSecurityRow(
                              title: 'Change Password',
                              subtitle: 'Update account master password',
                              icon: Icons.lock_outline_rounded,
                              isDark: isDark,
                              onTap: _showChangePasswordModal,
                            ),
                            const Divider(height: 1),
                            _buildSecurityRow(
                              title: 'Two-Factor Authentication',
                              subtitle: 'Email & SMS OTP protection',
                              icon: Icons.shield_outlined,
                              badge: 'ACTIVE',
                              isDark: isDark,
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('2-Factor Authentication is currently active for your account.'),
                                    backgroundColor: AppTheme.forest,
                                  ),
                                );
                              },
                            ),
                            const Divider(height: 1),
                            _buildSecurityRow(
                              title: 'Login Sessions',
                              subtitle: '1 active device session (Current)',
                              icon: Icons.devices_rounded,
                              isDark: isDark,
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Current session is active on ListenLeaf Web/Mobile Client.'),
                                  ),
                                );
                              },
                            ),
                            const Divider(height: 1),
                            _buildSecurityRow(
                              title: 'Notification Preferences',
                              subtitle: 'Email alerts, sync digests & sound reports',
                              icon: Icons.notifications_none_rounded,
                              isDark: isDark,
                              onTap: _showNotificationPrefsModal,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
  }

  Widget _buildFormField({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    required bool isDark,
    IconData? prefixIcon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 5),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : AppTheme.textDark,
          ),
          validator: validator,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w400,
              color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
            ),
            prefixIcon: prefixIcon != null
                ? Icon(
                    prefixIcon,
                    size: 16,
                    color: isDark ? AppTheme.textLightSecondary : AppTheme.forest,
                  )
                : null,
            filled: true,
            fillColor: isDark ? const Color(0xFF142419) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: isDark ? AppTheme.borderDark : const Color(0xFFD6E6DC),
                width: 1.1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppTheme.forest,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppTheme.rose,
                width: 1.2,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppTheme.rose,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityRow({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isDark,
    required VoidCallback onTap,
    String? badge,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.mintBg.withValues(alpha: 0.18) : AppTheme.mintBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 15, color: AppTheme.forest),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppTheme.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 10.5,
                      color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (badge != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.mintBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.mintBorder),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.green,
                  ),
                ),
              ),
              const SizedBox(width: 6),
            ],
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}
