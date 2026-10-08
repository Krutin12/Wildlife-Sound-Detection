import 'package:flutter/material.dart';
import '../config/app_theme.dart';

/// Exact Left Sidebar (1:1 with Reference Screenshot & Resilient Scroll Support).
class AppSidebar extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int> onSelectIndex;

  const AppSidebar({
    super.key,
    required this.activeIndex,
    required this.onSelectIndex,
  });

  static const List<_SidebarItem> _items = [
    _SidebarItem(icon: Icons.graphic_eq_rounded, label: 'Identify'),
    _SidebarItem(icon: Icons.history_rounded, label: 'History'),
    _SidebarItem(icon: Icons.menu_book_rounded, label: 'Species Library'),
    _SidebarItem(icon: Icons.bar_chart_rounded, label: 'Analytics'),
    _SidebarItem(icon: Icons.settings_outlined, label: 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      height: double.infinity,
      color: AppTheme.sidebarBg,
      child: Stack(
        children: [
          // Background Misty Forest & Deer Silhouette Effect
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            height: 180,
            child: Opacity(
              opacity: 0.18,
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const Icon(
                  Icons.forest_rounded,
                  size: 140,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          // Main Scrollable Column
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Brand Logo
                  Row(
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        width: 42,
                        height: 42,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.eco_rounded,
                          color: AppTheme.greenLight,
                          size: 34,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          RichText(
                            text: const TextSpan(
                              children: [
                                TextSpan(
                                  text: 'Wild',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.greenLight,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                TextSpan(
                                  text: 'Sound',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            'AI PLATFORM',
                            style: TextStyle(
                              fontSize: 8.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                              color: AppTheme.sidebarText,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  // Navigation Items
                  ...List.generate(_items.length, (index) {
                    final item = _items[index];
                    final isSelected = activeIndex == index;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(14),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () => onSelectIndex(index),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              gradient: isSelected ? AppTheme.sidebarActiveGradient : null,
                              color: isSelected ? null : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              border: isSelected
                                  ? Border.all(
                                      color: AppTheme.forestLight.withValues(alpha: 0.35),
                                      width: 1,
                                    )
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  item.icon,
                                  size: 18,
                                  color: isSelected
                                      ? AppTheme.sidebarTextActive
                                      : AppTheme.sidebarText,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  item.label,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                    color: isSelected
                                        ? AppTheme.sidebarTextActive
                                        : AppTheme.sidebarText,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 32),

                  // Bottom Intelligence Badge
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF162B1D),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppTheme.forestLight.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Bioacoustic Intelligence',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'v2.0 • Wildlife Conservation',
                          style: TextStyle(
                            fontSize: 9.5,
                            color: AppTheme.sidebarText,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Mini progress slider
                        ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: Container(
                            height: 3,
                            width: 48,
                            color: AppTheme.greenLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SidebarItem {
  final IconData icon;
  final String label;

  const _SidebarItem({
    required this.icon,
    required this.label,
  });
}
