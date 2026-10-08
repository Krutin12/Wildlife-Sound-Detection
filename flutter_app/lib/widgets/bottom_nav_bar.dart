import 'dart:ui';
import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Floating Glassmorphic Bottom Dock (Matching Screenshot Nav Items).
class AppBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const AppBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  static const List<_NavItem> _items = [
    _NavItem(icon: Icons.graphic_eq_rounded, activeIcon: Icons.graphic_eq_rounded, label: 'Identify'),
    _NavItem(icon: Icons.history_rounded, activeIcon: Icons.history_rounded, label: 'History'),
    _NavItem(icon: Icons.menu_book_rounded, activeIcon: Icons.menu_book_rounded, label: 'Species'),
    _NavItem(icon: Icons.bar_chart_rounded, activeIcon: Icons.bar_chart_rounded, label: 'Analytics'),
    _NavItem(icon: Icons.settings_outlined, activeIcon: Icons.settings_rounded, label: 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Container(
            height: 68,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xEB111D15)
                  : const Color(0xF2FFFFFF),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(
                color: isDark
                    ? const Color(0x335A9E6F)
                    : const Color(0xFFDFEAE3),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: List.generate(_items.length, (index) {
                final item = _items[index];
                final isSelected = currentIndex == index;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => onTap(index),
                    behavior: HitTestBehavior.opaque,
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (isDark
                                  ? AppTheme.sidebarActive
                                  : AppTheme.mintBg)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isSelected ? item.activeIcon : item.icon,
                              size: 19,
                              color: isSelected
                                  ? (isDark ? Colors.white : AppTheme.forestDark)
                                  : (isDark ? AppTheme.textLightSecondary : AppTheme.textMuted),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.label,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                                color: isSelected
                                    ? (isDark ? Colors.white : AppTheme.forestDark)
                                    : (isDark ? AppTheme.textLightSecondary : AppTheme.textMuted),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
