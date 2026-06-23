import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

/// A single teaching point inside a chapter.
class GrammarLesson {
  final String heading;
  final String body;
  final String bodyBn;
  final List<String> examples;
  GrammarLesson(
      {required this.heading,
      required this.body,
      required this.bodyBn,
      required this.examples});
  factory GrammarLesson.fromJson(Map<String, dynamic> j) => GrammarLesson(
        heading: j['heading'] ?? '',
        body: j['body'] ?? '',
        bodyBn: j['bodyBn'] ?? '',
        examples:
            ((j['examples'] ?? []) as List).map((e) => e.toString()).toList(),
      );
}

/// One multiple-choice practice question.
class GrammarQuestion {
  final String q;
  final List<String> options;
  final int answer;
  final String explain;
  GrammarQuestion(
      {required this.q,
      required this.options,
      required this.answer,
      required this.explain});
  factory GrammarQuestion.fromJson(Map<String, dynamic> j) => GrammarQuestion(
        q: j['q'] ?? '',
        options: ((j['options'] ?? []) as List).map((e) => e.toString()).toList(),
        answer: j['answer'] ?? 0,
        explain: j['explain'] ?? '',
      );
}

class GrammarChapter {
  final String id;
  final String title;
  final String titleBn;
  final String iconKey;
  final String intro;
  final String introBn;
  final List<GrammarLesson> lessons;
  final List<GrammarQuestion> quiz;

  GrammarChapter({
    required this.id,
    required this.title,
    required this.titleBn,
    required this.iconKey,
    required this.intro,
    required this.introBn,
    required this.lessons,
    required this.quiz,
  });

  IconData get icon => _icons[iconKey] ?? Icons.menu_book;

  factory GrammarChapter.fromJson(Map<String, dynamic> j) => GrammarChapter(
        id: j['id'] ?? '',
        title: j['title'] ?? '',
        titleBn: j['titleBn'] ?? '',
        iconKey: j['icon'] ?? '',
        intro: j['intro'] ?? '',
        introBn: j['introBn'] ?? '',
        lessons: ((j['lessons'] ?? []) as List)
            .map((e) => GrammarLesson.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        quiz: ((j['quiz'] ?? []) as List)
            .map((e) => GrammarQuestion.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
      );

  static const Map<String, IconData> _icons = {
    'category': Icons.category_outlined,
    'schedule': Icons.schedule,
    'swap_horiz': Icons.swap_horiz,
    'record_voice_over': Icons.record_voice_over_outlined,
    'transform': Icons.transform,
    'bolt': Icons.bolt,
    'article': Icons.article_outlined,
    'link': Icons.link,
  };
}

/// Loads and caches the bundled grammar syllabus.
class GrammarRepository {
  static List<GrammarChapter>? _cache;
  static Future<List<GrammarChapter>> load() async {
    if (_cache != null) return _cache!;
    final raw = await rootBundle.loadString('assets/grammar.json');
    final data = jsonDecode(raw) as Map<String, dynamic>;
    _cache = (data['chapters'] as List)
        .map((e) => GrammarChapter.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    return _cache!;
  }
}
