import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'api_client.dart';
import '../models/models.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Owns the session: token + current user, persisted across launches.
/// Exposes the shared [Api] so the rest of the app makes authenticated calls.
class AuthProvider extends ChangeNotifier {
  static const _kToken = 'auth_token';
  static const _kUser = 'auth_user';

  final ApiClient _client = ApiClient();
  late final Api api = Api(_client);

  AuthStatus status = AuthStatus.unknown;
  AppUser? user;

  bool get isAdmin => user?.isAdmin ?? false;

  /// Restore a saved session on app start.
  Future<void> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_kToken);
    final userJson = prefs.getString(_kUser);
    if (token != null && userJson != null) {
      _client.setToken(token);
      user = AppUser.fromJson(jsonDecode(userJson));
      status = AuthStatus.authenticated;
      notifyListeners();
      // Refresh profile in the background; ignore failures (offline/expired).
      _refreshProfile();
    } else {
      status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }

  Future<void> _refreshProfile() async {
    try {
      final fresh = await api.me();
      user = fresh;
      await _persistUser();
      notifyListeners();
    } on ApiException catch (e) {
      if (e.statusCode == 401) await logout();
    } catch (_) {/* offline — keep cached user */}
  }

  Future<void> login(String email, String password) async {
    final res = await api.login(email, password);
    await _apply(res.token, res.user);
  }

  Future<void> register(Map<String, dynamic> body) async {
    final res = await api.register(body);
    await _apply(res.token, res.user);
  }

  Future<void> _apply(String token, AppUser u) async {
    _client.setToken(token);
    user = u;
    status = AuthStatus.authenticated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kToken, token);
    await _persistUser();
    notifyListeners();
  }

  Future<void> _persistUser() async {
    if (user == null) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _kUser,
        jsonEncode({
          'id': user!.id,
          'name': user!.name,
          'email': user!.email,
          'role': user!.role,
          'phone': user!.phone,
          'institution': user!.institution,
          'level': user!.level,
          'address': user!.address,
          'enrolledBatches': user!.enrolledBatches,
        }));
  }

  /// Re-fetch the profile (used after enrollment changes alter batch access).
  Future<void> reloadUser() => _refreshProfile();

  Future<void> updateProfile(Map<String, dynamic> body) async {
    user = await api.updateMe(body);
    await _persistUser();
    notifyListeners();
  }

  Future<void> logout() async {
    user = null;
    _client.setToken(null);
    status = AuthStatus.unauthenticated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kToken);
    await prefs.remove(_kUser);
    notifyListeners();
  }
}
