// App-wide configuration.
//
// The API base URL can be overridden at build/run time without editing code:
//   flutter run --dart-define=API_BASE=https://your-backend.onrender.com
//
// Defaults are chosen so the app "just works" against a locally running
// backend on the common platforms:
//   - Android emulator -> 10.0.2.2 maps to the host machine's localhost
//   - iOS simulator / web / desktop -> localhost
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class AppConfig {
  /// Compile-time override (highest priority).
  static const String _override =
      String.fromEnvironment('API_BASE', defaultValue: '');

  static String get apiBase {
    if (_override.isNotEmpty) return _override;
    // Web and desktop talk to localhost directly.
    if (kIsWeb) return 'http://localhost:4000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:4000';
    } catch (_) {
      // Platform not available (e.g. web) -> fall through.
    }
    return 'http://localhost:4000';
  }

  /// All backend routes are mounted under the `/api` global prefix.
  static String get apiUrl => '$apiBase/api';

  static const String appName = 'Tasin English Academy';
  static const String appNameBn = 'তাসিন ইংলিশ একাডেমি';
}
