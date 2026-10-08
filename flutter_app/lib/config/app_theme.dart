import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// WildSound AI Design System (Pixel-matched with UI screenshot).
class AppTheme {
  AppTheme._();

  // ── Color Tokens (From Screenshot) ────────────────────────
  // Sidebar & Dark Forest
  static const Color sidebarBg       = Color(0xFF111D15); // Deep Pine Charcoal
  static const Color sidebarActive   = Color(0xFF2D5A3A); // Active Pill Green
  static const Color sidebarActiveGrad = Color(0xFF386B47);
  static const Color sidebarText     = Color(0xFF9CB8A3);
  static const Color sidebarTextActive = Color(0xFFFFFFFF);

  // Forest Green Palette
  static const Color forest          = Color(0xFF3D6B4F); // Primary Forest
  static const Color forestDark      = Color(0xFF2D5A3A); // Deep Button Green
  static const Color forestLight     = Color(0xFF5A9E6F); // Active Border/Accent
  static const Color forestButton    = Color(0xFF3D6B4F); // Analyze Audio Button
  static const Color sage            = Color(0xFF6B8F71);

  // Mint Badges & Icons
  static const Color mintBg          = Color(0xFFEAF5EE); // Light Mint Circle
  static const Color mintBorder      = Color(0xFFD2E8D9);
  static const Color mintText        = Color(0xFF2D8A4E);

  // Canvas & Card Colors
  static const Color bgCanvas        = Color(0xFFEFF5F1); // Misty Forest Canvas
  static const Color cardWhite       = Color(0xFFFFFFFF); // Card Surface
  static const Color cardBorder      = Color(0xFFDFEAE3); // Delicate Card Border
  static const Color innerDropzoneBg = Color(0xFFF9FCFA); // Inside Dropzone

  // Status & Badges
  static const Color green           = Color(0xFF2D8A4E);
  static const Color greenLight      = Color(0xFF34D399);
  static const Color amber           = Color(0xFFD97706);
  static const Color rose            = Color(0xFFDC2626);
  static const Color blue            = Color(0xFF2563EB);

  // Typography Colors
  static const Color textDark        = Color(0xFF141C16); // Title Dark
  static const Color textSecondary   = Color(0xFF5C6F62); // Subtitle Grey
  static const Color textMuted       = Color(0xFF8B9E90); // Muted Caption

  // Aliases
  static const Color primary         = forest;
  static const Color primaryDark     = forestDark;
  static const Color primaryDeep     = sidebarBg;
  static const Color primaryLight    = forestLight;
  static const Color primaryNeon     = greenLight;
  static const Color primarySoft     = mintBg;

  static const Color secondary       = amber;
  static const Color secondaryLight  = Color(0xFFFBBF24);
  static const Color accentCyan      = Color(0xFF06B6D4);
  static const Color accentRose      = rose;
  static const Color accentIndigo    = blue;

  static const Color bgDark          = Color(0xFF111D15);
  static const Color surfaceDark     = Color(0xFF182A1E);
  static const Color cardDark        = Color(0xFF1E3526);
  static const Color borderDark      = Color(0x335A9E6F);

  static const Color bgLight         = bgCanvas;
  static const Color surfaceLight    = cardWhite;
  static const Color cardLight       = cardWhite;
  static const Color borderLight     = cardBorder;

  static const Color error           = rose;
  static const Color success         = green;
  static const Color warning         = amber;
  static const Color info            = blue;

  static const Color textDarkPrimary   = textDark;
  static const Color textDarkSecondary = textSecondary;
  static const Color textDarkHint      = textMuted;

  static const Color textLightPrimary   = Color(0xFFFFFFFF);
  static const Color textLightSecondary = Color(0xFFA8C4AE);
  static const Color textLightHint      = Color(0xFF7A8B7E);

  // ── Gradients ─────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4A7E5E), Color(0xFF2D5A3A)],
  );

  static const LinearGradient neonGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [greenLight, forestLight],
  );

  static const LinearGradient darkMeshGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF16291C), Color(0xFF111D15)],
  );

  static const LinearGradient sidebarActiveGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF386B47), Color(0xFF264F32)],
  );

  static const LinearGradient analyzeButtonGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF4B7D5F), Color(0xFF38644A)],
  );

  // ── Light Theme ───────────────────────────────────────────
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.light(
      primary: forestDark,
      onPrimary: Colors.white,
      primaryContainer: mintBg,
      onPrimaryContainer: forestDark,
      secondary: amber,
      onSecondary: Colors.white,
      surface: cardWhite,
      onSurface: textDark,
      error: rose,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: bgCanvas,
      textTheme: _buildTextTheme(colorScheme, isDark: false),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: textDark,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: cardBorder, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: forestButton,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: forestDark,
          side: const BorderSide(color: cardBorder, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: cardBorder, width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: cardBorder, width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: forest, width: 2),
        ),
        labelStyle: GoogleFonts.inter(color: textSecondary, fontSize: 14),
        hintStyle: GoogleFonts.inter(color: textMuted, fontSize: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: mintBg,
        labelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textDark,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: cardBorder, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: cardBorder,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ── Dark Theme ────────────────────────────────────────────
  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.dark(
      primary: forestLight,
      onPrimary: Colors.white,
      primaryContainer: sidebarActive,
      onPrimaryContainer: Colors.white,
      secondary: secondaryLight,
      onSecondary: Colors.black,
      surface: surfaceDark,
      onSurface: textLightPrimary,
      error: rose,
      onError: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: bgDark,
      textTheme: _buildTextTheme(colorScheme, isDark: true),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textLightPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: textLightPrimary,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderDark, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: forestDark,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: forestLight,
          side: const BorderSide(color: forestLight, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: borderDark,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ── Text Theme ────────────────────────────────────────────
  static TextTheme _buildTextTheme(ColorScheme cs, {required bool isDark}) {
    final onSurface = cs.onSurface;
    final secondary = isDark ? textLightSecondary : textSecondary;

    return TextTheme(
      displayLarge: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w900, color: onSurface, letterSpacing: -0.8),
      displayMedium: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w800, color: onSurface, letterSpacing: -0.6),
      displaySmall: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: onSurface, letterSpacing: -0.4),
      headlineLarge: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: onSurface, letterSpacing: -0.3),
      headlineMedium: GoogleFonts.inter(fontSize: 19, fontWeight: FontWeight.w700, color: onSurface, letterSpacing: -0.2),
      headlineSmall: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700, color: onSurface),
      titleLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: onSurface),
      titleMedium: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: onSurface),
      titleSmall: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: onSurface),
      bodyLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400, color: onSurface, height: 1.5),
      bodyMedium: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w400, color: secondary, height: 1.45),
      bodySmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w400, color: secondary),
      labelLarge: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: onSurface),
      labelMedium: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: secondary),
      labelSmall: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: secondary, letterSpacing: 0.2),
    );
  }
}
