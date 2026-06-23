import 'package:flutter/material.dart';

/// Single source of truth for colours and component styling.
/// A calm indigo/teal academic palette, Material 3.
class AppTheme {
  static const seed = Color(0xFF3F4DB0); // indigo
  static const accent = Color(0xFF0F9D8C); // teal

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: seed,
      primary: seed,
      secondary: accent,
    );
    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(0xFFF6F7FB),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.black.withValues(alpha: 0.06)),
        ),
        color: Colors.white,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(50),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12)),
          textStyle:
              const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: const ChipThemeData(side: BorderSide.none),
    );
  }

  /// Status -> colour for payments, exams, classes.
  static Color statusColor(String status) => switch (status) {
        'approved' || 'completed' || 'evaluated' || 'present' =>
          const Color(0xFF1B9C5A),
        'pending' || 'scheduled' || 'open' || 'late' => const Color(0xFFE0930B),
        'rejected' || 'cancelled' || 'absent' => const Color(0xFFD64545),
        'live' => const Color(0xFF2563EB),
        _ => Colors.grey,
      };
}
