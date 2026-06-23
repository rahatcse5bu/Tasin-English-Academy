import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

/// Thrown for any non-2xx response. [message] is already user-friendly
/// (the backend returns Bangla messages for auth errors).
class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => message;
}

/// Thin HTTP wrapper around the NestJS API. A single instance is shared via
/// [AuthProvider]; the bearer token is injected on every request once set.
class ApiClient {
  String? _token;

  void setToken(String? token) => _token = token;
  bool get hasToken => _token != null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final cleaned = query?..removeWhere((_, v) => v == null);
    return Uri.parse('${AppConfig.apiUrl}$path').replace(
      queryParameters: cleaned?.map((k, v) => MapEntry(k, '$v')),
    );
  }

  dynamic _decode(http.Response r) {
    final body = r.body.isEmpty ? null : jsonDecode(r.body);
    if (r.statusCode >= 200 && r.statusCode < 300) return body;
    String msg = 'Something went wrong (${r.statusCode})';
    if (body is Map && body['message'] != null) {
      final m = body['message'];
      msg = m is List ? m.join('\n') : m.toString();
    }
    throw ApiException(r.statusCode, msg);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    final r = await http.get(_uri(path, query), headers: _headers);
    return _decode(r);
  }

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) async {
    final r = await http.post(_uri(path),
        headers: _headers, body: jsonEncode(body ?? {}));
    return _decode(r);
  }

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) async {
    final r = await http.patch(_uri(path),
        headers: _headers, body: jsonEncode(body ?? {}));
    return _decode(r);
  }

  Future<dynamic> delete(String path) async {
    final r = await http.delete(_uri(path), headers: _headers);
    return _decode(r);
  }

  /// GET that always yields a list (backend list endpoints return arrays).
  Future<List<Map<String, dynamic>>> getList(String path,
      {Map<String, dynamic>? query}) async {
    final data = await get(path, query: query);
    if (data is List) {
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }
}
