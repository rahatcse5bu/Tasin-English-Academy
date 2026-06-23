import 'package:flutter/material.dart';
import '../../data/grammar.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Grammar hub: a grid of chapters. Each opens a Learn + Practice view.
class GrammarScreen extends StatefulWidget {
  const GrammarScreen({super.key});
  @override
  State<GrammarScreen> createState() => _GrammarScreenState();
}

class _GrammarScreenState extends State<GrammarScreen> {
  late Future<List<GrammarChapter>> _future;

  @override
  void initState() {
    super.initState();
    _future = GrammarRepository.load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Grammar')),
      body: FutureBuilder<List<GrammarChapter>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError || !snap.hasData) {
            return const EmptyState(
                icon: Icons.menu_book_outlined,
                message: 'Grammar lessons could not be loaded.');
          }
          final chapters = snap.data!;
          return GridView.count(
            crossAxisCount: 2,
            padding: const EdgeInsets.all(16),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
            children: chapters
                .map((c) => _ChapterCard(chapter: c))
                .toList(),
          );
        },
      ),
    );
  }
}

class _ChapterCard extends StatelessWidget {
  final GrammarChapter chapter;
  const _ChapterCard({required this.chapter});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => GrammarChapterScreen(chapter: chapter))),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                  color: AppTheme.seed.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12)),
              child: Icon(chapter.icon, color: AppTheme.seed),
            ),
            const Spacer(),
            Text(chapter.title,
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w700)),
            Text(chapter.titleBn,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            const SizedBox(height: 6),
            Text('${chapter.lessons.length} lessons • ${chapter.quiz.length} Qs',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }
}

/// Learn (lessons) + Practice (quiz) for one chapter.
class GrammarChapterScreen extends StatelessWidget {
  final GrammarChapter chapter;
  const GrammarChapterScreen({super.key, required this.chapter});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(chapter.title),
          bottom: const TabBar(tabs: [
            Tab(text: 'Learn', icon: Icon(Icons.menu_book_outlined)),
            Tab(text: 'Practice', icon: Icon(Icons.sports_esports_outlined)),
          ]),
        ),
        body: TabBarView(children: [
          _LearnTab(chapter: chapter),
          chapter.quiz.isEmpty
              ? const EmptyState(
                  icon: Icons.quiz_outlined, message: 'No practice yet.')
              : _PracticeTab(chapter: chapter),
        ]),
      ),
    );
  }
}

class _LearnTab extends StatelessWidget {
  final GrammarChapter chapter;
  const _LearnTab({required this.chapter});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [AppTheme.seed, AppTheme.accent]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(chapter.intro,
                  style: const TextStyle(color: Colors.white, height: 1.4)),
              const SizedBox(height: 8),
              Text(chapter.introBn,
                  style: const TextStyle(color: Colors.white70, height: 1.5)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...chapter.lessons.map((l) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l.heading,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text(l.body, style: const TextStyle(height: 1.4)),
                    if (l.bodyBn.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(l.bodyBn,
                          style: TextStyle(
                              color: Colors.grey.shade700, height: 1.5)),
                    ],
                    if (l.examples.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      ...l.examples.map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.chevron_right,
                                    size: 18, color: AppTheme.accent),
                                Expanded(
                                    child: Text(e,
                                        style: const TextStyle(
                                            fontStyle: FontStyle.italic))),
                              ],
                            ),
                          )),
                    ],
                  ],
                ),
              ),
            )),
        const SizedBox(height: 8),
        Card(
          color: AppTheme.accent.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              const Icon(Icons.sports_esports_outlined, color: AppTheme.accent),
              const SizedBox(width: 12),
              const Expanded(
                  child: Text(
                      'Ready? Switch to the Practice tab to test yourself!')),
            ]),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

/// Interactive quiz with instant feedback, explanations and a final score.
class _PracticeTab extends StatefulWidget {
  final GrammarChapter chapter;
  const _PracticeTab({required this.chapter});
  @override
  State<_PracticeTab> createState() => _PracticeTabState();
}

class _PracticeTabState extends State<_PracticeTab> {
  int _index = 0;
  int _score = 0;
  int? _picked;
  bool _finished = false;

  List<GrammarQuestion> get _q => widget.chapter.quiz;

  void _choose(int i) {
    if (_picked != null) return;
    setState(() {
      _picked = i;
      if (i == _q[_index].answer) _score++;
    });
  }

  void _nextOrFinish() {
    if (_index + 1 >= _q.length) {
      setState(() => _finished = true);
    } else {
      setState(() {
        _index++;
        _picked = null;
      });
    }
  }

  void _restart() => setState(() {
        _index = 0;
        _score = 0;
        _picked = null;
        _finished = false;
      });

  @override
  Widget build(BuildContext context) {
    if (_finished) return _result();
    final q = _q[_index];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(children: [
          Text('Question ${_index + 1} of ${_q.length}',
              style: TextStyle(color: Colors.grey.shade600)),
          const Spacer(),
          Chip(
              visualDensity: VisualDensity.compact,
              avatar: const Icon(Icons.star, size: 16, color: Color(0xFFE0930B)),
              label: Text('$_score')),
        ]),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: (_index + (_picked != null ? 1 : 0)) / _q.length,
          backgroundColor: Colors.grey.shade200,
          minHeight: 6,
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Text(q.q,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w700, height: 1.4)),
          ),
        ),
        const SizedBox(height: 12),
        ...List.generate(q.options.length, (i) {
          final correct = i == q.answer;
          final picked = _picked == i;
          Color? bg;
          Color? fg;
          IconData? icon;
          if (_picked != null) {
            if (correct) {
              bg = const Color(0xFF1B9C5A).withValues(alpha: 0.15);
              fg = const Color(0xFF1B9C5A);
              icon = Icons.check_circle;
            } else if (picked) {
              bg = const Color(0xFFD64545).withValues(alpha: 0.15);
              fg = const Color(0xFFD64545);
              icon = Icons.cancel;
            }
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: bg ?? Colors.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => _choose(i),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black12),
                  ),
                  child: Row(children: [
                    Expanded(
                      child: Text(q.options[i],
                          style: TextStyle(
                              fontSize: 15,
                              color: fg,
                              fontWeight: fg != null
                                  ? FontWeight.w700
                                  : FontWeight.w500)),
                    ),
                    if (icon != null) Icon(icon, color: fg),
                  ]),
                ),
              ),
            ),
          );
        }),
        if (_picked != null) ...[
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
                color: const Color(0xFFF1F3FA),
                borderRadius: BorderRadius.circular(12)),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.lightbulb_outline, size: 20, color: AppTheme.seed),
              const SizedBox(width: 10),
              Expanded(child: Text(q.explain, style: const TextStyle(height: 1.4))),
            ]),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _nextOrFinish,
            icon: Icon(_index + 1 >= _q.length
                ? Icons.flag
                : Icons.arrow_forward),
            label: Text(_index + 1 >= _q.length ? 'See result' : 'Next'),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _result() {
    final pct = (_score / _q.length) * 100;
    final pass = pct >= 60;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(pass ? Icons.emoji_events : Icons.menu_book,
                size: 72,
                color: pass ? const Color(0xFFE0930B) : AppTheme.seed),
            const SizedBox(height: 16),
            Text(pass ? 'Well done! 🎉' : 'Keep practising!',
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('You scored $_score out of ${_q.length}  (${pct.toStringAsFixed(0)}%)',
                style: TextStyle(fontSize: 16, color: Colors.grey.shade700)),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _restart,
              icon: const Icon(Icons.restart_alt),
              label: const Text('Try again'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.menu_book),
              label: const Text('Back to chapters'),
            ),
          ],
        ),
      ),
    );
  }
}
