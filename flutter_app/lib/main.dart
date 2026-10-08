import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'config/app_theme.dart';
import 'config/app_router.dart';
import 'providers/auth_provider.dart';
import 'providers/prediction_provider.dart';
import 'providers/history_provider.dart';
import 'providers/species_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialise the API service singleton
  await ApiService().init();

  // Load saved theme preference
  final themeProvider = ThemeProvider();
  await themeProvider.loadTheme();

  runApp(ListenLeafApp(themeProvider: themeProvider));
}

class ListenLeafApp extends StatelessWidget {
  final ThemeProvider themeProvider;

  const ListenLeafApp({super.key, required this.themeProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
        ChangeNotifierProvider<PredictionProvider>(
            create: (_) => PredictionProvider()),
        ChangeNotifierProvider<HistoryProvider>(
            create: (_) => HistoryProvider()),
        ChangeNotifierProvider<SpeciesProvider>(
            create: (_) => SpeciesProvider()),
        ChangeNotifierProvider<ThemeProvider>.value(value: themeProvider),
      ],
      child: Consumer<ThemeProvider>(
        builder: (_, theme, _) {
          return MaterialApp(
            title: 'ListenLeaf',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: theme.themeMode,
            initialRoute: AppRouter.splash,
            onGenerateRoute: AppRouter.onGenerateRoute,
          );
        },
      ),
    );
  }
}
