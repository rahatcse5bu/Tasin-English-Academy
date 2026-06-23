import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../data/vocabulary.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'notifications_screen.dart';
import 'batches_screen.dart';
import 'payments_screen.dart';
import 'attendance_screen.dart';
import 'resources_screen.dart';
import 'vocabulary_screen.dart';

/// Student home: greeting, next class, attendance snapshot, latest
/// suggestions, and quick links. Pulls several endpoints in parallel.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<_DashData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_DashData> _load() async {
    final auth = context.read<AuthProvider>();
    final api = auth.api;
    final enrolled = auth.user?.enrolledBatches.toSet() ?? {};
    final results = await Future.wait([
      api.classes(),
      api.resources(kind: 'suggestion'),
      api.myResults(),
      api.myAttendanceStats(),
      api.batches(),
    ]);
    final classes = (results[0] as List<ClassSession>)
        .where((c) =>
            enrolled.contains(c.batchId) &&
            c.scheduledAt != null &&
            c.scheduledAt!.isAfter(DateTime.now().subtract(const Duration(hours: 2))))
        .toList()
      ..sort((a, b) => a.scheduledAt!.compareTo(b.scheduledAt!));
    return _DashData(
      upcoming: classes,
      suggestions: results[1] as List<Resource>,
      results: results[2] as List<ExamResult>,
      stats: results[3] as AttendanceStats,
      batches: results[4] as List<Batch>,
      wordOfDay: await _wordOfDay(),
    );
  }

  /// A stable word for the calendar day, drawn from the bundled word bank.
  Future<VocabWord?> _wordOfDay() async {
    try {
      final words = await VocabularyRepository.load();
      if (words.isEmpty) return null;
      final now = DateTime.now();
      final dayOfYear =
          now.difference(DateTime(now.year)).inDays; // 0..365
      return words[dayOfYear % words.length];
    } catch (_) {
      return null;
    }
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Welcome back',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w400)),
            Text(user?.name ?? '',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const NotificationsScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<_DashData>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Loading();
            }
            if (snap.hasError) {
              return ListView(children: [
                EmptyState(
                    icon: Icons.cloud_off,
                    message: 'Could not load your dashboard.\n${snap.error}',
                    onRetry: _refresh)
              ]);
            }
            final d = snap.data!;
            final nextClass = d.upcoming.isEmpty ? null : d.upcoming.first;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _NextClassCard(nextClass: nextClass, batches: d.batches),
                const SizedBox(height: 16),
                _QuickStats(stats: d.stats, resultCount: d.results.length),
                const SizedBox(height: 8),
                _quickLinks(context),
                if (d.wordOfDay != null) ...[
                  const SizedBox(height: 8),
                  _WordOfDayCard(word: d.wordOfDay!),
                ],
                const SizedBox(height: 8),
                SectionHeader('Latest Suggestions',
                    trailing: TextButton(
                      onPressed: () {},
                      child: const Text('See all'),
                    )),
                if (d.suggestions.isEmpty)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                          'No suggestions shared yet. Check back soon!'),
                    ),
                  )
                else
                  ...d.suggestions.take(4).map((r) => _SuggestionTile(r)),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _quickLinks(BuildContext context) {
    Widget item(IconData icon, String label, Widget page) => Expanded(
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => page)),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Column(
                children: [
                  Icon(icon, color: AppTheme.seed),
                  const SizedBox(height: 6),
                  Text(label, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ),
        );
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Row(children: [
          item(Icons.groups_outlined, 'Batches', const BatchesScreen()),
          item(Icons.payments_outlined, 'Payments', const PaymentsScreen()),
          item(Icons.fact_check_outlined, 'Attendance',
              const AttendanceScreen()),
          item(Icons.lightbulb_outline, 'Learn', const ResourcesScreen()),
        ]),
      ),
    );
  }
}

class _DashData {
  final List<ClassSession> upcoming;
  final List<Resource> suggestions;
  final List<ExamResult> results;
  final AttendanceStats stats;
  final List<Batch> batches;
  final VocabWord? wordOfDay;
  _DashData(
      {required this.upcoming,
      required this.suggestions,
      required this.results,
      required this.stats,
      required this.batches,
      this.wordOfDay});
}

/// Compact "Word of the Day" promo that opens the full word detail.
class _WordOfDayCard extends StatelessWidget {
  final VocabWord word;
  const _WordOfDayCard({required this.word});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => showWordDetail(context, word),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: AppTheme.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.wb_sunny_outlined,
                    color: AppTheme.accent),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('WORD OF THE DAY',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                            color: Colors.grey.shade500)),
                    const SizedBox(height: 2),
                    Text('${word.word}  ·  ${word.bn}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
                    if (word.synonyms.isNotEmpty)
                      Text('synonyms: ${word.synonyms.take(3).join(', ')}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade600)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

class _NextClassCard extends StatelessWidget {
  final ClassSession? nextClass;
  final List<Batch> batches;
  const _NextClassCard({required this.nextClass, required this.batches});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
            colors: [AppTheme.seed, AppTheme.accent],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(18),
      ),
      child: nextClass == null
          ? const Row(
              children: [
                Icon(Icons.event_available, color: Colors.white, size: 32),
                SizedBox(width: 14),
                Expanded(
                  child: Text('No upcoming classes scheduled.',
                      style: TextStyle(color: Colors.white, fontSize: 15)),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('NEXT CLASS',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
                const SizedBox(height: 8),
                Text(nextClass!.title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.schedule, color: Colors.white70, size: 16),
                  const SizedBox(width: 6),
                  Text(fmtDateTime(nextClass!.scheduledAt),
                      style: const TextStyle(color: Colors.white)),
                ]),
                const SizedBox(height: 14),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppTheme.seed,
                      minimumSize: const Size(0, 44)),
                  onPressed: () => openUrl(context, nextClass!.gmeetLink),
                  icon: const Icon(Icons.videocam),
                  label: const Text('Join Google Meet'),
                ),
              ],
            ),
    );
  }
}

class _QuickStats extends StatelessWidget {
  final AttendanceStats stats;
  final int resultCount;
  const _QuickStats({required this.stats, required this.resultCount});

  @override
  Widget build(BuildContext context) {
    Widget box(String value, String label, IconData icon, Color color) =>
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
              child: Column(
                children: [
                  Icon(icon, color: color),
                  const SizedBox(height: 8),
                  Text(value,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w800)),
                  Text(label,
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
            ),
          ),
        );
    return Row(children: [
      box('${stats.rate.toStringAsFixed(0)}%', 'Attendance',
          Icons.fact_check_outlined, const Color(0xFF1B9C5A)),
      const SizedBox(width: 12),
      box('${stats.total}', 'Classes', Icons.event_note_outlined,
          AppTheme.seed),
      const SizedBox(width: 12),
      box('$resultCount', 'Results', Icons.emoji_events_outlined,
          const Color(0xFFE0930B)),
    ]);
  }
}

class _SuggestionTile extends StatelessWidget {
  final Resource r;
  const _SuggestionTile(this.r);
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: const CircleAvatar(
            backgroundColor: Color(0xFFE9ECFB),
            child: Icon(Icons.lightbulb, color: AppTheme.seed)),
        title: Text(r.titleBn?.isNotEmpty == true ? r.titleBn! : r.title),
        subtitle: Text(
          r.bodyBn?.isNotEmpty == true ? r.bodyBn! : (r.body ?? r.kindLabel),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        onTap: () => showResourceDetail(context, r),
      ),
    );
  }
}
