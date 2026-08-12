import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/auth_provider.dart';
import '../../../theme.dart';
import '../../../widgets/common.dart';

String _s(dynamic v) => v?.toString() ?? '';
String _norm(String s) => s
    .trim()
    .toLowerCase()
    .replaceAll(RegExp('[.,\'’"]'), '')
    .replaceAll(RegExp(r'\s+'), ' ');
List<Map<String, dynamic>> _maps(dynamic v) =>
    ((v as List?) ?? []).map((e) => Map<String, dynamic>.from(e as Map)).toList();

/// Loads a unit, shows a lesson picker and the interactive [LessonStudio].
class UnitLessonScreen extends StatefulWidget {
  final String classId;
  final String subjectId;
  final String unitId;
  const UnitLessonScreen(
      {super.key,
      required this.classId,
      required this.subjectId,
      required this.unitId});
  @override
  State<UnitLessonScreen> createState() => _UnitLessonScreenState();
}

class _UnitLessonScreenState extends State<UnitLessonScreen> {
  late Future<Map<String, dynamic>> _future;
  int _sel = 0;

  @override
  void initState() {
    super.initState();
    _future = context
        .read<AuthProvider>()
        .api
        .learnUnit(widget.classId, widget.subjectId, widget.unitId);
  }

  /// Regular lessons followed by poems (rendered as poem-flavoured lessons).
  List<Map<String, dynamic>> _items(Map<String, dynamic> unit) {
    final lessons = _maps(unit['lessons']);
    final poems = _maps(unit['poems']);
    final poemLessons = poems.map((p) {
      final kw = _maps(p['key_words']);
      return <String, dynamic>{
        'id': p['id'] ?? 'poem',
        'number': '🪶',
        'title': p['title'],
        'is_poem': true,
        'poet': p['poet'],
        'keywords': kw.map((k) => k['word']).whereType<String>().toList(),
        'reading': {
          'summary_en': p['central_idea'] ?? p['theme'],
          'gist_bn': p['gist_bn'],
        },
        'qa': p['qa'],
        'vocab': kw
            .map((k) => {'word': k['word'], 'bangla': k['bangla']})
            .toList(),
      };
    }).toList();
    return [...lessons, ...poemLessons];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lesson')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError) {
            return EmptyState(
                icon: Icons.cloud_off,
                message: '${snap.error}',
                onRetry: () => setState(() {
                      _future = context.read<AuthProvider>().api.learnUnit(
                          widget.classId, widget.subjectId, widget.unitId);
                    }));
          }
          final unit = snap.data!;
          final items = _items(unit);
          if (items.isEmpty) {
            return const EmptyState(
                icon: Icons.menu_book_outlined, message: 'No lessons yet.');
          }
          final lesson = items[_sel.clamp(0, items.length - 1)];
          return Column(
            children: [
              // unit header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                        '${unit['subject']?['nameBn'] ?? ''} • UNIT ${unit['number']}',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                            color: AppTheme.seed)),
                    Text(_s(unit['title']),
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w800)),
                    if (_s(unit['banglaTitle']).isNotEmpty)
                      Text(_s(unit['banglaTitle']),
                          style: TextStyle(color: Colors.grey.shade600)),
                  ],
                ),
              ),
              // lesson picker
              SizedBox(
                height: 46,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final on = i == _sel;
                    final l = items[i];
                    final isPoem = l['is_poem'] == true;
                    return ChoiceChip(
                      selected: on,
                      onSelected: (_) => setState(() => _sel = i),
                      avatar: isPoem
                          ? const Text('🪶')
                          : CircleAvatar(
                              backgroundColor:
                                  on ? Colors.white24 : AppTheme.seed,
                              child: Text('${l['number']}',
                                  style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700)),
                            ),
                      label: Text(_s(l['title']),
                          overflow: TextOverflow.ellipsis),
                    );
                  },
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: LessonStudio(
                    key: ValueKey(lesson['id']), lesson: lesson),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// ====================================================================
/// The interactive lesson — a tab per available activity.
/// ====================================================================
class LessonStudio extends StatelessWidget {
  final Map<String, dynamic> lesson;
  const LessonStudio({super.key, required this.lesson});

  @override
  Widget build(BuildContext context) {
    final tabs = <({String label, IconData icon, Widget view})>[];

    final reading = lesson['reading'] as Map?;
    final warmup = (lesson['warmup'] as List?) ?? [];
    if ((reading?['summary_en'] ?? '').toString().isNotEmpty ||
        warmup.isNotEmpty) {
      tabs.add((label: 'Read', icon: Icons.menu_book, view: _ReadTab(lesson)));
    }
    final vocab = _maps(lesson['vocab']);
    if (vocab.isNotEmpty) {
      tabs.add((
        label: 'Words',
        icon: Icons.style_outlined,
        view: _VocabTab(vocab)
      ));
    }
    final mcqs = _maps(lesson['mcqs']);
    if (mcqs.isNotEmpty) {
      tabs.add((label: 'Quiz', icon: Icons.quiz_outlined, view: _QuizTab(mcqs)));
    }
    final short = _maps(lesson['short_answers']);
    if (short.isNotEmpty) {
      tabs.add((
        label: 'Short Q',
        icon: Icons.edit_note,
        view: _RevealTab(short)
      ));
    }
    final tf = _maps(lesson['true_false']);
    if (tf.isNotEmpty) {
      tabs.add((
        label: 'True/False',
        icon: Icons.rule,
        view: _TrueFalseTab(tf)
      ));
    }
    final cloze = lesson['cloze'] as Map?;
    if (cloze != null && (cloze['blanks'] as List?)?.isNotEmpty == true) {
      tabs.add((
        label: 'Fill Gap',
        icon: Icons.extension_outlined,
        view: _ClozeTab(Map<String, dynamic>.from(cloze))
      ));
    }
    final match = lesson['match'] as Map?;
    if (match != null && (match['pairs'] as List?)?.isNotEmpty == true) {
      tabs.add((
        label: 'Match',
        icon: Icons.compare_arrows,
        view: _MatchTab(Map<String, dynamic>.from(match))
      ));
    }
    final table = lesson['table'] as Map?;
    if (table != null && (table['rows'] as List?)?.isNotEmpty == true) {
      tabs.add((
        label: 'Table',
        icon: Icons.table_chart_outlined,
        view: _TableTab(Map<String, dynamic>.from(table))
      ));
    }
    final summary = lesson['summary'] as Map?;
    if (summary != null && (summary['model'] ?? '').toString().isNotEmpty) {
      tabs.add((
        label: 'Summary',
        icon: Icons.notes,
        view: _SummaryTab(Map<String, dynamic>.from(summary))
      ));
    }
    final writing = lesson['writing'] as Map?;
    if (writing != null && (writing['model'] ?? '').toString().isNotEmpty) {
      tabs.add((
        label: 'Writing',
        icon: Icons.draw_outlined,
        view: _WritingTab(Map<String, dynamic>.from(writing))
      ));
    }
    final qa = _maps(lesson['qa']);
    if (qa.isNotEmpty) {
      tabs.add((
        label: 'Q & A',
        icon: Icons.forum_outlined,
        view: _RevealTab(qa, qa: true)
      ));
    }

    if (tabs.isEmpty) {
      return const EmptyState(
          icon: Icons.menu_book_outlined,
          message: 'No activities for this lesson.');
    }

    return DefaultTabController(
      length: tabs.length,
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppTheme.seed,
            indicatorColor: AppTheme.seed,
            tabs: [
              for (final t in tabs)
                Tab(text: t.label, icon: Icon(t.icon, size: 18)),
            ],
          ),
          Expanded(
            child: TabBarView(children: [for (final t in tabs) t.view]),
          ),
        ],
      ),
    );
  }
}

/// ---- shared little widgets ----------------------------------------
Widget _card({required Widget child, Color? bg, Color? border}) => Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg ?? Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: border ?? Colors.black.withValues(alpha: 0.06)),
      ),
      child: child,
    );

Widget _heading(String t, Color c) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(t.toUpperCase(),
          style: TextStyle(
              fontSize: 11.5,
              letterSpacing: .6,
              fontWeight: FontWeight.w800,
              color: c)),
    );

/// ---- READ ----------------------------------------------------------
class _ReadTab extends StatelessWidget {
  final Map<String, dynamic> lesson;
  const _ReadTab(this.lesson);
  @override
  Widget build(BuildContext context) {
    final reading = (lesson['reading'] as Map?) ?? {};
    final keywords = (lesson['keywords'] as List?) ?? [];
    final warmup = (lesson['warmup'] as List?) ?? [];
    final learn = _s(lesson['learn_line']);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (learn.isNotEmpty)
          _card(
            bg: const Color(0xFFEEF1FA),
            border: const Color(0xFFD4DAF3),
            child: Text('🎯 $learn',
                style: TextStyle(color: AppTheme.seed, height: 1.4)),
          ),
        if (keywords.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                for (final k in keywords)
                  Chip(
                    visualDensity: VisualDensity.compact,
                    backgroundColor: const Color(0xFFFFF2D9),
                    side: BorderSide.none,
                    label: Text(_s(k),
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFFB7791F))),
                  ),
              ],
            ),
          ),
        if (_s(reading['summary_en']).isNotEmpty)
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _heading("📘 What it's about", AppTheme.seed),
                Text(_s(reading['summary_en']),
                    style: const TextStyle(fontSize: 15, height: 1.55)),
                if (_s(reading['book_page']).isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text('📍 বইয়ের পৃষ্ঠা ${reading['book_page']}',
                        style: TextStyle(
                            fontSize: 12, color: Colors.grey.shade500)),
                  ),
              ],
            ),
          ),
        if (_s(reading['gist_bn']).isNotEmpty)
          _card(
            bg: const Color(0xFFE7F6F3),
            border: const Color(0xFFC2E8E0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _heading('🟢 বাংলা সারাংশ', AppTheme.accent),
                Text(_s(reading['gist_bn']),
                    style: const TextStyle(
                        fontSize: 15, height: 1.6, color: Color(0xFF155249))),
              ],
            ),
          ),
        if (warmup.isNotEmpty)
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _heading('🤔 ভাবো তো', Colors.grey),
                for (int i = 0; i < warmup.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${i + 1}. ',
                            style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.seed)),
                        Expanded(
                            child: Text(_s(warmup[i]),
                                style: const TextStyle(height: 1.4))),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

/// ---- VOCAB FLASHCARDS ---------------------------------------------
class _VocabTab extends StatefulWidget {
  final List<Map<String, dynamic>> vocab;
  const _VocabTab(this.vocab);
  @override
  State<_VocabTab> createState() => _VocabTabState();
}

class _VocabTabState extends State<_VocabTab> {
  int _i = 0;
  bool _flipped = false;

  void _go(int d) => setState(() {
        _flipped = false;
        _i = (_i + d + widget.vocab.length) % widget.vocab.length;
      });

  @override
  Widget build(BuildContext context) {
    final v = widget.vocab[_i];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('কার্ড ${_i + 1} / ${widget.vocab.length}',
                  style: TextStyle(
                      color: Colors.grey.shade500,
                      fontWeight: FontWeight.w700,
                      fontSize: 12)),
              Text('ট্যাপ করে অর্থ দেখো',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 10),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _flipped = !_flipped),
              child: _FlipCard(flipped: _flipped, word: v),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                    onPressed: () => _go(-1), child: const Text('‹ আগের')),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                    onPressed: () => _go(1), child: const Text('পরের ›')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FlipCard extends StatelessWidget {
  final bool flipped;
  final Map<String, dynamic> word;
  const _FlipCard({required this.flipped, required this.word});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: flipped ? 1 : 0),
      duration: const Duration(milliseconds: 420),
      builder: (context, t, _) {
        final angle = t * math.pi;
        final showBack = t > 0.5;
        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateY(angle),
          child: showBack
              ? Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()..rotateY(math.pi),
                  child: _back(),
                )
              : _front(),
        );
      },
    );
  }

  Widget _front() => Container(
        decoration: BoxDecoration(
            color: AppTheme.seed, borderRadius: BorderRadius.circular(20)),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_s(word['pos']).isNotEmpty)
              Text(_s(word['pos']).toUpperCase(),
                  style: const TextStyle(
                      color: Color(0xFFFFD27A),
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2,
                      fontSize: 12)),
            const SizedBox(height: 10),
            Text(_s(word['word']),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 40,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 10),
            const Text('তাপ দাও → অর্থ দেখো',
                style: TextStyle(color: Colors.white70)),
          ],
        ),
      );

  Widget _back() => Container(
        decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.black.withValues(alpha: 0.08))),
        padding: const EdgeInsets.all(22),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_s(word['word']),
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800)),
              if (_s(word['bangla']).isNotEmpty)
                Text(_s(word['bangla']),
                    style: TextStyle(
                        fontSize: 20,
                        color: AppTheme.seed,
                        fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (_s(word['meaning_en']).isNotEmpty)
                Text(_s(word['meaning_en']),
                    style: TextStyle(color: Colors.grey.shade700, height: 1.4)),
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 8, children: [
                if (_s(word['synonym']).isNotEmpty)
                  _tag('syn: ${word['synonym']}', const Color(0xFFE7F6F3),
                      AppTheme.accent),
                if (_s(word['antonym']).isNotEmpty && _s(word['antonym']) != '—')
                  _tag('ant: ${word['antonym']}', const Color(0xFFFCE7EC),
                      const Color(0xFFD64545)),
              ]),
              if (_s(word['example']).isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.only(left: 10),
                  decoration: const BoxDecoration(
                      border: Border(
                          left: BorderSide(
                              color: Color(0xFFFFD27A), width: 3))),
                  child: Text('"${word['example']}"',
                      style: TextStyle(
                          fontStyle: FontStyle.italic,
                          color: Colors.grey.shade600)),
                ),
              ],
            ],
          ),
        ),
      );

  Widget _tag(String t, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration:
            BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
        child: Text(t,
            style: TextStyle(
                color: fg, fontSize: 12.5, fontWeight: FontWeight.w600)),
      );
}

/// ---- MCQ QUIZ ------------------------------------------------------
class _QuizTab extends StatefulWidget {
  final List<Map<String, dynamic>> mcqs;
  const _QuizTab(this.mcqs);
  @override
  State<_QuizTab> createState() => _QuizTabState();
}

class _QuizTabState extends State<_QuizTab> {
  int _qi = 0, _score = 0, _streak = 0;
  int? _picked;

  void _pick(int i, int answer) {
    if (_picked != null) return;
    setState(() {
      _picked = i;
      if (i == answer) {
        _score++;
        _streak++;
      } else {
        _streak = 0;
      }
    });
  }

  void _next() => setState(() {
        _qi++;
        _picked = null;
      });

  void _restart() => setState(() {
        _qi = 0;
        _score = 0;
        _streak = 0;
        _picked = null;
      });

  @override
  Widget build(BuildContext context) {
    if (_qi >= widget.mcqs.length) {
      final total = widget.mcqs.length;
      final pct = (_score / total * 100).round();
      final badge = pct == 100
          ? '🏆 দুর্দান্ত'
          : pct >= 70
              ? '⭐ ভালো'
              : '📚 আরও চেষ্টা';
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('$_score/$total',
                  style: TextStyle(
                      fontSize: 52,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.seed)),
              const SizedBox(height: 8),
              StatusPill(pct >= 70 ? 'approved' : 'pending', label: badge),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                  onPressed: _restart,
                  icon: const Icon(Icons.refresh),
                  label: const Text('আবার চেষ্টা করো')),
            ],
          ),
        ),
      );
    }

    final q = widget.mcqs[_qi];
    final options = (q['options'] as List?) ?? [];
    final answer = int.tryParse(_s(q['answer_index'])) ?? 0;
    final answered = _picked != null;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('প্রশ্ন ${_qi + 1} / ${widget.mcqs.length}',
                style: TextStyle(
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w700,
                    fontSize: 12)),
            Text('🔥 $_streak · $_score ✓',
                style: const TextStyle(
                    color: Color(0xFFB7791F),
                    fontWeight: FontWeight.w700,
                    fontSize: 12)),
          ],
        ),
        const SizedBox(height: 12),
        Text(_s(q['q']),
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 14),
        for (int i = 0; i < options.length; i++)
          _OptionTile(
            text: _s(options[i]),
            state: !answered
                ? _OptState.idle
                : i == answer
                    ? _OptState.correct
                    : (i == _picked ? _OptState.wrong : _OptState.idle),
            onTap: () => _pick(i, answer),
          ),
        if (answered && _s(q['explain']).isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 6),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: const Color(0xFFFFF7E6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF4DCA0))),
            child: Text('💡 ${q['explain']}',
                style: const TextStyle(color: Color(0xFF7A5A00), height: 1.4)),
          ),
        const SizedBox(height: 14),
        FilledButton(
            onPressed: answered ? _next : null, child: const Text('পরের ›')),
      ],
    );
  }
}

enum _OptState { idle, correct, wrong }

class _OptionTile extends StatelessWidget {
  final String text;
  final _OptState state;
  final VoidCallback onTap;
  const _OptionTile(
      {required this.text, required this.state, required this.onTap});
  @override
  Widget build(BuildContext context) {
    Color border = Colors.black.withValues(alpha: 0.12);
    Color? bg;
    Color fg = Colors.black87;
    if (state == _OptState.correct) {
      border = AppTheme.accent;
      bg = const Color(0xFFE7F6F3);
      fg = const Color(0xFF155249);
    } else if (state == _OptState.wrong) {
      border = const Color(0xFFD64545);
      bg = const Color(0xFFFCE7EC);
      fg = const Color(0xFF9E2A3B);
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: state == _OptState.idle ? onTap : null,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
              color: bg ?? Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: border)),
          child: Text(text,
              style: TextStyle(
                  color: fg,
                  fontWeight: state == _OptState.idle
                      ? FontWeight.w500
                      : FontWeight.w700)),
        ),
      ),
    );
  }
}

/// ---- SHORT ANSWERS / Q&A ------------------------------------------
class _RevealTab extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  final bool qa;
  const _RevealTab(this.items, {this.qa = false});
  @override
  State<_RevealTab> createState() => _RevealTabState();
}

class _RevealTabState extends State<_RevealTab> {
  final _open = <int>{};
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: widget.items.length,
      itemBuilder: (_, i) {
        final it = widget.items[i];
        final open = _open.contains(i);
        return _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.qa ? '💬 ' : 'প্র${i + 1}. ',
                      style: TextStyle(
                          fontWeight: FontWeight.w800, color: AppTheme.seed)),
                  Expanded(
                      child: Text(_s(it['q']),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, height: 1.4))),
                ],
              ),
              const SizedBox(height: 8),
              if (open)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                      color: const Color(0xFFF6F7FB),
                      borderRadius: BorderRadius.circular(10)),
                  child: Text(_s(it['model']),
                      style: const TextStyle(height: 1.5)),
                )
              else
                TextButton(
                    onPressed: () => setState(() => _open.add(i)),
                    style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(0, 0),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                    child: const Text('উত্তর দেখাও →')),
            ],
          ),
        );
      },
    );
  }
}

/// ---- TRUE / FALSE --------------------------------------------------
class _TrueFalseTab extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  const _TrueFalseTab(this.items);
  @override
  State<_TrueFalseTab> createState() => _TrueFalseTabState();
}

class _TrueFalseTabState extends State<_TrueFalseTab> {
  final _ans = <int, bool>{};
  bool _truth(dynamic v) => v == true || v == 'True' || v == 'true';

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: widget.items.length,
      itemBuilder: (_, i) {
        final it = widget.items[i];
        final picked = _ans[i];
        final correct = _truth(it['is_true']);
        final done = picked != null;
        return _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_s(it['statement']),
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, height: 1.4)),
              const SizedBox(height: 10),
              Row(
                children: [
                  for (final val in [true, false])
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(right: val ? 8 : 0),
                        child: _tfButton(val, picked, correct, done, i),
                      ),
                    ),
                ],
              ),
              if (done) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                      color: picked == correct
                          ? const Color(0xFFE7F6F3)
                          : const Color(0xFFFCE7EC),
                      borderRadius: BorderRadius.circular(10)),
                  child: Text(
                    '${picked == correct ? "সঠিক! " : "ভুল — "}${_s(it['correction'])}',
                    style: TextStyle(
                        color: picked == correct
                            ? const Color(0xFF155249)
                            : const Color(0xFF9E2A3B),
                        height: 1.4),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _tfButton(bool val, bool? picked, bool correct, bool done, int i) {
    Color border = Colors.black.withValues(alpha: 0.12);
    Color fg = Colors.black54;
    Color? bg;
    if (done && val == correct) {
      border = AppTheme.accent;
      bg = const Color(0xFFE7F6F3);
      fg = const Color(0xFF155249);
    } else if (done && picked == val && val != correct) {
      border = const Color(0xFFD64545);
      bg = const Color(0xFFFCE7EC);
      fg = const Color(0xFF9E2A3B);
    }
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: done ? null : () => setState(() => _ans[i] = val),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        alignment: Alignment.center,
        decoration: BoxDecoration(
            color: bg ?? Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: border)),
        child: Text(val ? '✔ True' : '✗ False',
            style: TextStyle(color: fg, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

/// ---- CLOZE ---------------------------------------------------------
class _ClozeTab extends StatefulWidget {
  final Map<String, dynamic> cloze;
  const _ClozeTab(this.cloze);
  @override
  State<_ClozeTab> createState() => _ClozeTabState();
}

class _ClozeTabState extends State<_ClozeTab> {
  late final List<String> _blanks =
      ((widget.cloze['blanks'] as List?) ?? []).map(_s).toList();
  late final List<TextEditingController> _ctrls =
      List.generate(_blanks.length, (_) => TextEditingController());
  bool _checked = false;

  @override
  void dispose() {
    for (final c in _ctrls) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = _s(widget.cloze['text_with_blanks']);
    int correct = 0;
    if (_checked) {
      for (int i = 0; i < _blanks.length; i++) {
        if (_norm(_ctrls[i].text) == _norm(_blanks[i])) correct++;
      }
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          child: Text(text, style: const TextStyle(fontSize: 15, height: 1.7)),
        ),
        for (int i = 0; i < _blanks.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: TextField(
              controller: _ctrls[i],
              onChanged: (_) {
                if (_checked) setState(() => _checked = false);
              },
              decoration: InputDecoration(
                isDense: true,
                prefixText: '(${i + 1})  ',
                hintText: 'উত্তর লেখো',
                suffixIcon: !_checked
                    ? null
                    : (_norm(_ctrls[i].text) == _norm(_blanks[i])
                        ? const Icon(Icons.check_circle,
                            color: AppTheme.accent)
                        : const Icon(Icons.cancel, color: Color(0xFFD64545))),
                helperText: _checked &&
                        _norm(_ctrls[i].text) != _norm(_blanks[i])
                    ? 'সঠিক: ${_blanks[i]}'
                    : null,
                helperStyle: const TextStyle(color: Color(0xFFD64545)),
              ),
            ),
          ),
        const SizedBox(height: 4),
        FilledButton(
            onPressed: () => setState(() => _checked = true),
            child: const Text('উত্তর মিলাও')),
        if (_checked)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Center(
              child: Text('$correct / ${_blanks.length} সঠিক',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Colors.grey.shade700)),
            ),
          ),
      ],
    );
  }
}

/// ---- MATCH ---------------------------------------------------------
class _MatchTab extends StatefulWidget {
  final Map<String, dynamic> match;
  const _MatchTab(this.match);
  @override
  State<_MatchTab> createState() => _MatchTabState();
}

class _MatchTabState extends State<_MatchTab> {
  late final List<String> _left =
      ((widget.match['left'] as List?) ?? []).map(_s).toList();
  late final List<String> _right =
      ((widget.match['right'] as List?) ?? []).map(_s).toList();
  late final Map<int, int> _answer = {
    for (final p in (widget.match['pairs'] as List? ?? []))
      (p[0] as num).toInt(): (p[1] as num).toInt()
  };
  int? _selL;
  final Map<int, int> _made = {}; // leftIdx -> rightIdx

  @override
  Widget build(BuildContext context) {
    final usedRight = _made.values.toSet();
    final allDone = _made.length == _left.length;
    final correct =
        _made.entries.where((e) => _answer[e.key] == e.value).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('বাঁ দিক থেকে বেছে নাও, তারপর ডান দিক থেকে মিলাও',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                children: [
                  for (int i = 0; i < _left.length; i++)
                    _matchTile(
                      text: _left[i],
                      selected: _selL == i,
                      done: _made.containsKey(i),
                      correct: _made.containsKey(i)
                          ? _answer[i] == _made[i]
                          : null,
                      onTap: _made.containsKey(i)
                          ? null
                          : () => setState(() => _selL = i),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                children: [
                  for (int j = 0; j < _right.length; j++)
                    _matchTile(
                      text: _right[j],
                      selected: false,
                      done: usedRight.contains(j),
                      correct: null,
                      muted: usedRight.contains(j),
                      onTap: usedRight.contains(j) || _selL == null
                          ? null
                          : () => setState(() {
                                _made[_selL!] = j;
                                _selL = null;
                              }),
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        OutlinedButton(
            onPressed: () => setState(() {
                  _made.clear();
                  _selL = null;
                }),
            child: const Text('রিসেট')),
        if (allDone)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Center(
              child: Text('$correct / ${_left.length} সঠিক মিল',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Colors.grey.shade700)),
            ),
          ),
      ],
    );
  }

  Widget _matchTile({
    required String text,
    required bool selected,
    required bool done,
    bool? correct,
    bool muted = false,
    VoidCallback? onTap,
  }) {
    Color border = Colors.black.withValues(alpha: 0.12);
    Color? bg;
    if (selected) {
      border = AppTheme.seed;
      bg = const Color(0xFFEEF1FA);
    } else if (correct == true) {
      border = AppTheme.accent;
      bg = const Color(0xFFE7F6F3);
    } else if (correct == false) {
      border = const Color(0xFFD64545);
      bg = const Color(0xFFFCE7EC);
    } else if (muted) {
      bg = const Color(0xFFF0F1F5);
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
          decoration: BoxDecoration(
              color: bg ?? Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: border)),
          child: Text(text,
              style: TextStyle(
                  fontSize: 13.5,
                  color: muted ? Colors.grey : Colors.black87)),
        ),
      ),
    );
  }
}

/// ---- TABLE ---------------------------------------------------------
class _TableTab extends StatefulWidget {
  final Map<String, dynamic> table;
  const _TableTab(this.table);
  @override
  State<_TableTab> createState() => _TableTabState();
}

class _TableTabState extends State<_TableTab> {
  final _open = <int>{};
  @override
  Widget build(BuildContext context) {
    final headers = ((widget.table['headers'] as List?) ?? []).map(_s).toList();
    final rows = (widget.table['rows'] as List?) ?? [];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          child: Column(
            children: [
              if (headers.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      for (final h in headers)
                        Expanded(
                            child: Text(h,
                                style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: Colors.grey.shade600,
                                    fontSize: 13))),
                    ],
                  ),
                ),
              for (int i = 0; i < rows.length; i++) ...[
                const Divider(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (int j = 0;
                        j < (rows[i] as List).length;
                        j++)
                      Expanded(
                        child: j == 0
                            ? Text(_s(rows[i][j]),
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600))
                            : (_open.contains(i)
                                ? Text(_s(rows[i][j]),
                                    style: const TextStyle(
                                        color: Color(0xFF155249)))
                                : TextButton(
                                    onPressed: () =>
                                        setState(() => _open.add(i)),
                                    style: TextButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        alignment: Alignment.centerLeft,
                                        minimumSize: const Size(0, 0),
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap),
                                    child: const Text('দেখাও'))),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// ---- SUMMARY -------------------------------------------------------
class _SummaryTab extends StatefulWidget {
  final Map<String, dynamic> summary;
  const _SummaryTab(this.summary);
  @override
  State<_SummaryTab> createState() => _SummaryTabState();
}

class _SummaryTabState extends State<_SummaryTab> {
  bool _show = false;
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_s(widget.summary['skeleton']).isNotEmpty)
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _heading('🧱 কাঠামো (নিজে ভরো)', Colors.grey),
                Text(_s(widget.summary['skeleton']),
                    style: const TextStyle(height: 1.6)),
              ],
            ),
          ),
        _card(
          bg: const Color(0xFFE7F6F3),
          border: const Color(0xFFC2E8E0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _heading('✅ মডেল সারাংশ', AppTheme.accent),
              if (_show)
                Text(_s(widget.summary['model']),
                    style: const TextStyle(height: 1.6))
              else
                TextButton(
                    onPressed: () => setState(() => _show = true),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: const Text('মডেল উত্তর দেখাও →')),
            ],
          ),
        ),
      ],
    );
  }
}

/// ---- WRITING -------------------------------------------------------
class _WritingTab extends StatefulWidget {
  final Map<String, dynamic> writing;
  const _WritingTab(this.writing);
  @override
  State<_WritingTab> createState() => _WritingTabState();
}

class _WritingTabState extends State<_WritingTab> {
  final _ctrl = TextEditingController();
  bool _show = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final words =
        _ctrl.text.trim().isEmpty ? 0 : _ctrl.text.trim().split(RegExp(r'\s+')).length;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_s(widget.writing['type']).isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: StatusPill('open', label: _s(widget.writing['type'])),
                ),
              Text(_s(widget.writing['prompt']),
                  style: const TextStyle(
                      fontWeight: FontWeight.w700, height: 1.4)),
              const SizedBox(height: 12),
              TextField(
                controller: _ctrl,
                onChanged: (_) => setState(() {}),
                maxLines: 7,
                decoration:
                    const InputDecoration(hintText: 'এখানে তোমার উত্তর লেখো...'),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text('$words শব্দ',
                      style: TextStyle(
                          color: Colors.grey.shade500, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
        _card(
          bg: const Color(0xFFE7F6F3),
          border: const Color(0xFFC2E8E0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _heading('✅ মডেল রচনা', AppTheme.accent),
              if (_show)
                Text(_s(widget.writing['model']),
                    style: const TextStyle(height: 1.6))
              else
                TextButton(
                    onPressed: () => setState(() => _show = true),
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: const Text('মডেল উত্তর দেখাও →')),
            ],
          ),
        ),
      ],
    );
  }
}
