import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

/// One vocabulary entry: an English word with its part of speech, Bangla
/// meaning, synonyms, antonyms and an example sentence.
class VocabWord {
  final String word;
  final String pos;
  final String bn;
  final List<String> synonyms;
  final List<String> antonyms;
  final String example;

  VocabWord({
    required this.word,
    required this.pos,
    required this.bn,
    required this.synonyms,
    required this.antonyms,
    required this.example,
  });

  factory VocabWord.fromJson(Map<String, dynamic> j) => VocabWord(
        word: j['word'] ?? '',
        pos: j['pos'] ?? '',
        bn: j['bn'] ?? '',
        synonyms:
            ((j['synonyms'] ?? []) as List).map((e) => e.toString()).toList(),
        antonyms:
            ((j['antonyms'] ?? []) as List).map((e) => e.toString()).toList(),
        example: j['example'] ?? '',
      );
}

/// Loads the bundled word bank once and caches it for the session.
class VocabularyRepository {
  static List<VocabWord>? _cache;

  static Future<List<VocabWord>> load() async {
    if (_cache != null) return _cache!;
    final raw = await rootBundle.loadString('assets/vocabulary.json');
    final list = (jsonDecode(raw) as List)
        .map((e) => VocabWord.fromJson(Map<String, dynamic>.from(e)))
        .toList()
      ..sort((a, b) => a.word.toLowerCase().compareTo(b.word.toLowerCase()));
    _cache = list;
    return list;
  }
}
