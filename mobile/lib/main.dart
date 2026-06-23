import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config.dart';
import 'theme.dart';
import 'services/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/student/student_shell.dart';
import 'screens/admin/admin_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TasinApp());
}

class TasinApp extends StatelessWidget {
  const TasinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..bootstrap(),
      child: MaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const _Gate(),
      ),
    );
  }
}

/// Routes the user to the right home based on auth status and role.
class _Gate extends StatelessWidget {
  const _Gate();
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.unauthenticated:
        return const LoginScreen();
      case AuthStatus.authenticated:
        return auth.isAdmin ? const AdminShell() : const StudentShell();
    }
  }
}
