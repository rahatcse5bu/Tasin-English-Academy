import 'dart:math';
import 'package:flutter/material.dart';
import '../../data/vocabulary.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Vocabulary Builder — learn English words with Bangla meaning, synonyms
/// and antonyms. Three modes: Browse, Flashcards, and a Quiz.
class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key});
  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  late Future<List<VocabWord>> _future;

  @override
  void initState() {
    super.initState();
    _future = VocabularyRepository.load();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Vocabulary Builder'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Browse', icon: Icon(Icons.list_alt)),
            Tab(text: 'Flashcards', icon: Icon(Icons.style_outlined)),
            Tab(text: 'Quiz', icon: Icon(Icons.quiz_outlined)),
          ]),
        ),
        body: FutureBuilder<List<VocabWord>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Loading();
            }
            if (snap.hasError || !snap.hasData || snap.data!.isEmpty) {
              return const EmptyState(
                  icon: Icons.menu_book_outlined,
                  message: 'Word bank could not be loaded.');
            }
            final words = snap.data!;
            return TabBarView(children: [
              _BrowseTab(words: words),
              _FlashcardsTab(words: words),
              _QuizTab(words: words),
            ]);
          },
        ),
      ),
    );
  }
}

/// Word detail bottom sheet shared by Browse and Flashcards.
void showWordDetail(BuildContext context, VocabWord w) {
  showModalBottomSheet(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (_) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      child: _WordBody(w: w),
    ),
  );
}

class _WordBody extends StatelessWidget {
  final VocabWord w;
  const _WordBody({required this.w});

  Widget _chips(String label, List<String> items, Color color) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 14),
        Text(label,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items
              .map((s) => Chip(
                    label: Text(s),
                    backgroundColor: color.withValues(alpha: 0.12),
                    labelStyle: TextStyle(color: color),
                    side: BorderSide.none,
                  ))
              .toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Flexible(
              child: Text(w.word,
                  style: const TextStyle(
                      fontSize: 26, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 8),
            Text(w.pos,
                style: TextStyle(
                    fontStyle: FontStyle.italic, color: Colors.grey.shade600)),
          ],
        ),
        const SizedBox(height: 8),
        Text(w.bn,
            style: const TextStyle(
                fontSize: 19, fontWeight: FontWeight.w600, color: AppTheme.seed)),
        _chips('Synonyms', w.synonyms, const Color(0xFF1B9C5A)),
        _chips('Antonyms', w.antonyms, const Color(0xFFD64545)),
        if (w.example.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: const Color(0xFFF1F3FA),
                borderRadius: BorderRadius.circular(10)),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.format_quote, size: 18, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                    child: Text(w.example,
                        style: const TextStyle(
                            fontStyle: FontStyle.italic, height: 1.4))),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------- Browse ----------------
class _BrowseTab extends StatefulWidget {
  final List<VocabWord> words;
  const _BrowseTab({required this.words});
  @override
  State<_BrowseTab> createState() => _BrowseTabState();
}

class _BrowseTabState extends State<_BrowseTab> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final items = widget.words.where((w) {
      final q = _q.toLowerCase();
      return q.isEmpty ||
          w.word.toLowerCase().contains(q) ||
          w.bn.contains(_q) ||
          w.synonyms.any((s) => s.toLowerCase().contains(q));
    }).toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
          child: TextField(
            decoration: const InputDecoration(
                hintText: 'Search word, meaning or synonym',
                prefixIcon: Icon(Icons.search)),
            onChanged: (v) => setState(() => _q = v),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
                '${items.length} of ${widget.words.length} words • tap for synonyms, antonyms & example',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? const EmptyState(
                  icon: Icons.search_off, message: 'No matching words.')
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final w = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(w.word,
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(w.bn,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                        trailing: Text(w.pos,
                            style: TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: Colors.grey.shade500)),
                        onTap: () => showWordDetail(context, w),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ---------------- Flashcards ----------------
class _FlashcardsTab extends StatefulWidget {
  final List<VocabWord> words;
  const _FlashcardsTab({required this.words});
  @override
  State<_FlashcardsTab> createState() => _FlashcardsTabState();
}

class _FlashcardsTabState extends State<_FlashcardsTab> {
  late List<VocabWord> _deck;
  int _index = 0;
  bool _flipped = false;

  @override
  void initState() {
    super.initState();
    _deck = List.of(widget.words);
  }

  void _shuffle() => setState(() {
        _deck.shuffle(Random(DateTime.now().microsecond));
        _index = 0;
        _flipped = false;
      });

  void _next() => setState(() {
        _index = (_index + 1) % _deck.length;
        _flipped = false;
      });
  void _prev() => setState(() {
        _index = (_index - 1 + _deck.length) % _deck.length;
        _flipped = false;
      });

  @override
  Widget build(BuildContext context) {
    final w = _deck[_index];
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Text('${_index + 1} / ${_deck.length}',
                  style: TextStyle(color: Colors.grey.shade600)),
              const Spacer(),
              TextButton.icon(
                  onPressed: _shuffle,
                  icon: const Icon(Icons.shuffle),
                  label: const Text('Shuffle')),
            ],
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _flipped = !_flipped),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Container(
                  key: ValueKey(_flipped),
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(vertical: 16),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: _flipped
                        ? null
                        : const LinearGradient(
                            colors: [AppTheme.seed, AppTheme.accent],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight),
                    color: _flipped ? Colors.white : null,
                    borderRadius: BorderRadius.circular(20),
                    border: _flipped
                        ? Border.all(color: Colors.black12)
                        : null,
                  ),
                  child: Center(
                    child: _flipped
                        ? SingleChildScrollView(child: _WordBody(w: w))
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(w.word,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white)),
                              const SizedBox(height: 10),
                              Text(w.pos,
                                  style: const TextStyle(
                                      color: Colors.white70,
                                      fontStyle: FontStyle.italic)),
                              const SizedBox(height: 24),
                              const Text('Tap to reveal meaning',
                                  style: TextStyle(color: Colors.white70)),
                            ],
                          ),
                  ),
                ),
              ),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                    onPressed: _prev,
                    icon: const Icon(Icons.chevron_left),
                    label: const Text('Previous')),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                    onPressed: _next,
                    icon: const Icon(Icons.chevron_right),
                    label: const Text('Next')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------- Quiz ----------------
class _QuizTab extends StatefulWidget {
  final List<VocabWord> words;
  const _QuizTab({required this.words});
  @override
  State<_QuizTab> createState() => _QuizTabState();
}

class _QuizTabState extends State<_QuizTab> {
  final _rng = Random();
  late VocabWord _answer;
  late List<VocabWord> _options;
  bool _askBangla = true; // true: pick Bangla meaning; false: pick synonym
  String? _picked;
  int _score = 0;
  int _asked = 0;

  @override
  void initState() {
    super.initState();
    _nextQuestion();
  }

  void _nextQuestion() {
    final pool = List.of(widget.words)..shuffle(_rng);
    _answer = pool.first;
    // Prefer synonym questions only for words that actually have synonyms.
    _askBangla = _answer.synonyms.isEmpty ? true : _rng.nextBool();
    final distractors = pool.skip(1).take(3).toList();
    _options = [_answer, ...distractors]..shuffle(_rng);
    _picked = null;
    setState(() {});
  }

  String _optionText(VocabWord w) =>
      _askBangla ? w.bn : (w.synonyms.isNotEmpty ? w.synonyms.first : w.word);

  bool _isCorrect(VocabWord w) => w.word == _answer.word;

  void _choose(VocabWord w) {
    if (_picked != null) return;
    setState(() {
      _picked = w.word;
      _asked++;
      if (_isCorrect(w)) _score++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Chip(
                avatar: const Icon(Icons.emoji_events, size: 18),
                label: Text('Score: $_score / $_asked')),
            const Spacer(),
            TextButton.icon(
                onPressed: () => setState(() {
                      _score = 0;
                      _asked = 0;
                      _nextQuestion();
                    }),
                icon: const Icon(Icons.restart_alt),
                label: const Text('Reset')),
          ],
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    _askBangla
                        ? 'Bangla meaning of:'
                        : 'A synonym of:',
                    style: TextStyle(color: Colors.grey.shade600)),
                const SizedBox(height: 6),
                Text(_answer.word,
                    style: const TextStyle(
                        fontSize: 26, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ..._options.map((o) {
          final isAnswer = _isCorrect(o);
          final isPicked = _picked == o.word;
          Color? bg;
          Color? fg;
          if (_picked != null) {
            if (isAnswer) {
              bg = const Color(0xFF1B9C5A).withValues(alpha: 0.15);
              fg = const Color(0xFF1B9C5A);
            } else if (isPicked) {
              bg = const Color(0xFFD64545).withValues(alpha: 0.15);
              fg = const Color(0xFFD64545);
            }
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Material(
              color: bg ?? Colors.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => _choose(o),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.black12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(_optionText(o),
                            style: TextStyle(
                                fontSize: 16,
                                color: fg,
                                fontWeight: fg != null
                                    ? FontWeight.w700
                                    : FontWeight.w500)),
                      ),
                      if (_picked != null && isAnswer)
                        const Icon(Icons.check_circle,
                            color: Color(0xFF1B9C5A)),
                      if (_picked != null && isPicked && !isAnswer)
                        const Icon(Icons.cancel, color: Color(0xFFD64545)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
        if (_picked != null) ...[
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _nextQuestion,
            icon: const Icon(Icons.arrow_forward),
            label: const Text('Next question'),
          ),
        ],
      ],
    );
  }
}
