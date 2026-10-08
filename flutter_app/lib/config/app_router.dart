import 'package:flutter/material.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/otp_verification_screen.dart';
import '../screens/home_screen.dart';
import '../screens/detect/detect_screen.dart';
import '../screens/location/animal_location_screen.dart';
import '../screens/detect/prediction_result_screen.dart';
import '../screens/history/history_screen.dart';
import '../screens/species/species_list_screen.dart';
import '../screens/species/species_detail_screen.dart';
import '../screens/analytics/analytics_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/settings/profile_screen.dart';

/// Centralised named-route definitions for ListenLeaf.
class AppRouter {
  AppRouter._();

  // Route names
  static const String splash        = '/';
  static const String login         = '/login';
  static const String register      = '/register';
  static const String otpVerify     = '/otp-verify';
  static const String home          = '/home';
  static const String detect        = '/detect';
  static const String location      = '/location';
  static const String result        = '/result';
  static const String history       = '/history';
  static const String speciesList   = '/species';
  static const String speciesDetail = '/species-detail';
  static const String analytics     = '/analytics';
  static const String settings      = '/settings';
  static const String profile       = '/profile';

  /// Generate routes from settings.
  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return _fade(const SplashScreen());
      case login:
        return _slide(const LoginScreen());
      case register:
        return _slide(const RegisterScreen());
      case otpVerify:
        final args = routeSettings.arguments as Map<String, dynamic>?;
        return _slide(OtpVerificationScreen(
          challengeId: args?['challengeId'] ?? '',
          maskedDestination: args?['maskedDestination'] ?? '',
          method: args?['method'] ?? 'email',
        ));
      case home:
        return _fade(const HomeScreen());
      case detect:
        return _slide(const DetectScreen());
      case location:
        return _slide(const AnimalLocationScreen());
      case result:
        return _slide(const PredictionResultScreen());
      case history:
        return _slide(const HistoryScreen());
      case speciesList:
        return _slide(const SpeciesListScreen());
      case speciesDetail:
        final args = routeSettings.arguments as Map<String, dynamic>?;
        return _slide(SpeciesDetailScreen(speciesData: args ?? {}));
      case analytics:
        return _slide(const AnalyticsScreen());
      case settings:
        return _slide(const SettingsScreen());
      case profile:
        return _slide(const ProfileScreen());
      default:
        return _fade(const SplashScreen());
    }
  }

  // ── Transitions ───────────────────────────────────────────
  static PageRouteBuilder _fade(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, anim, _, child) =>
          FadeTransition(opacity: anim, child: child),
      transitionDuration: const Duration(milliseconds: 300),
    );
  }

  static PageRouteBuilder _slide(Widget page) {
    return PageRouteBuilder(
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, anim, _, child) {
        final tween = Tween(begin: const Offset(1, 0), end: Offset.zero)
            .chain(CurveTween(curve: Curves.easeOutCubic));
        return SlideTransition(position: anim.drive(tween), child: child);
      },
      transitionDuration: const Duration(milliseconds: 350),
    );
  }
}
