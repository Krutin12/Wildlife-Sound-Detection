import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_sidebar.dart';
import 'detect/detect_screen.dart';
import 'history/history_screen.dart';
import 'species/species_list_screen.dart';
import 'analytics/analytics_screen.dart';
import 'settings/settings_screen.dart';

/// Main home shell matching the WildSound AI layout across desktop & mobile (with sliding Sidebar Drawer on mobile).
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = const [
    DetectScreen(),
    HistoryScreen(),
    SpeciesListScreen(),
    AnalyticsScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // ── Desktop / Tablet layout (>= 900px): Persistent Left Sidebar ──
        if (constraints.maxWidth >= 900) {
          return Scaffold(
            body: Row(
              children: [
                AppSidebar(
                  activeIndex: _currentIndex,
                  onSelectIndex: (idx) => setState(() => _currentIndex = idx),
                ),
                Expanded(
                  child: IndexedStack(
                    index: _currentIndex,
                    children: _screens,
                  ),
                ),
              ],
            ),
          );
        }

        // ── Mobile layout (< 900px): Mobile Top App Bar + Slide-in Sidebar Drawer ──
        return Scaffold(
          key: _scaffoldKey,
          backgroundColor: AppTheme.bgCanvas,
          appBar: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Container(
              color: AppTheme.sidebarBg,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Brand Logo & Title (Tap opens drawer)
                      GestureDetector(
                        onTap: () => _scaffoldKey.currentState?.openDrawer(),
                        behavior: HitTestBehavior.opaque,
                        child: Row(
                          children: [
                            Image.asset(
                              'assets/images/logo.png',
                              width: 34,
                              height: 34,
                              fit: BoxFit.contain,
                              errorBuilder: (_, _, _) => const Icon(
                                Icons.eco_rounded,
                                color: AppTheme.greenLight,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                RichText(
                                  text: const TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'Wild',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.greenLight,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'Sound ',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'AI',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.greenLight,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Text(
                                  'WILDLIFE BIOACOUSTICS',
                                  style: TextStyle(
                                    fontSize: 7.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.1,
                                    color: AppTheme.sidebarText,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // User Profile Avatar on Top-Right (Tap opens Profile Screen)
                      GestureDetector(
                        onTap: () => setState(() => _currentIndex = 4),
                        behavior: HitTestBehavior.opaque,
                        child: Consumer<AuthProvider>(
                          builder: (context, auth, _) {
                            final user = auth.user;
                            final initials = user != null && user.fullName.isNotEmpty
                                ? user.initials
                                : 'AS';
                            return Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: AppTheme.primaryGradient,
                                border: Border.all(
                                  color: AppTheme.greenLight.withValues(alpha: 0.8),
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.forest.withValues(alpha: 0.4),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  initials,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          drawer: Drawer(
            width: 290,
            backgroundColor: AppTheme.sidebarBg,
            child: AppSidebar(
              activeIndex: _currentIndex,
              onSelectIndex: (idx) {
                setState(() => _currentIndex = idx);
                Navigator.pop(context);
              },
            ),
          ),
          body: IndexedStack(
            index: _currentIndex,
            children: _screens,
          ),
        );
      },
    );
  }
}
