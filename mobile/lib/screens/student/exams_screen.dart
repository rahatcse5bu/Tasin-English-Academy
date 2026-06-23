import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Exams tab with two views: Exams (upcoming/open, open the Google Form to
/// sit the test) and My Results (marks, rank, percentage).
class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});
  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> {
  late Future<_ExamData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_ExamData> _load() async {
    final auth = context.read<AuthProvider>();
    final enrolled = auth.user?.enrolledBatches.toSet() ?? {};
    final res = await Future.wait([
      auth.api.exams(),
      auth.api.myResults(),
      auth.api.topPerformers(limit: 5),
    ]);
    final exams = (res[0] as List<Exam>)
        .where((e) => enrolled.isEmpty || enrolled.contains(e.batchId))
        .toList()
      ..sort((a, b) => (b.scheduledAt ?? DateTime(0))
          .compareTo(a.scheduledAt ?? DateTime(0)));
    return _ExamData(
      exams: exams,
      results: res[1] as List<ExamResult>,
      top: res[2] as List<ExamResult>,
    );
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Exams'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Exams'),
            Tab(text: 'My Results'),
          ]),
        ),
        body: FutureBuilder<_ExamData>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Loading();
            }
            if (snap.hasError) {
              return EmptyState(
                  icon: Icons.cloud_off,
                  message: '${snap.error}',
                  onRetry: _refresh);
            }
            final d = snap.data!;
            return TabBarView(children: [
              _examsList(d),
              _resultsList(d),
            ]);
          },
        ),
      ),
    );
  }

  Widget _examsList(_ExamData d) {
    if (d.exams.isEmpty) {
      return const EmptyState(
          icon: Icons.assignment_outlined, message: 'No exams scheduled yet.');
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: d.exams.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final e = d.exams[i];
          final canTake = e.status == 'open' && e.googleFormUrl?.isNotEmpty == true;
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                        child: Text(e.title,
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w700))),
                    StatusPill(e.status),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                    const SizedBox(width: 6),
                    Text(fmtDateTime(e.scheduledAt)),
                    const SizedBox(width: 14),
                    Icon(Icons.star_outline, size: 16, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text('${e.totalMarks} marks'),
                  ]),
                  if (canTake) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () => openUrl(context, e.googleFormUrl),
                        icon: const Icon(Icons.open_in_new),
                        label: const Text('Take Exam'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _resultsList(_ExamData d) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader('🏆 Top Performers'),
          if (d.top.isEmpty)
            const Card(
                child: Padding(
                    padding: EdgeInsets.all(16), child: Text('No rankings yet.')))
          else
            Card(
              child: Column(
                children: d.top.asMap().entries.map((entry) {
                  final i = entry.key;
                  final r = entry.value;
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: switch (i) {
                        0 => const Color(0xFFFFD700),
                        1 => const Color(0xFFC0C0C0),
                        2 => const Color(0xFFCD7F32),
                        _ => const Color(0xFFEEF1FA),
                      },
                      child: Text('${i + 1}',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    title: Text(r.studentName ?? 'Student'),
                    subtitle: Text(r.exam?.title ?? ''),
                    trailing: Text('${r.marks.toStringAsFixed(0)}/${r.totalMarks.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                  );
                }).toList(),
              ),
            ),
          const SizedBox(height: 8),
          const SectionHeader('My Results'),
          if (d.results.isEmpty)
            const EmptyState(
                icon: Icons.grading, message: 'No results published yet.')
          else
            ...d.results.map((r) => _ResultCard(r)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _ExamData {
  final List<Exam> exams;
  final List<ExamResult> results;
  final List<ExamResult> top;
  _ExamData({required this.exams, required this.results, required this.top});
}

class _ResultCard extends StatelessWidget {
  final ExamResult r;
  const _ResultCard(this.r);
  @override
  Widget build(BuildContext context) {
    final pct = r.percent;
    final color = pct >= 80
        ? const Color(0xFF1B9C5A)
        : pct >= 50
            ? const Color(0xFFE0930B)
            : const Color(0xFFD64545);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 52,
              height: 52,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: pct / 100,
                    backgroundColor: color.withValues(alpha: 0.15),
                    color: color,
                    strokeWidth: 5,
                  ),
                  Text('${pct.toStringAsFixed(0)}%',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: color)),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.exam?.title ?? 'Exam',
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(
                      '${r.marks.toStringAsFixed(0)} / ${r.totalMarks.toStringAsFixed(0)} marks'
                      '${r.rank != null ? '  •  Rank #${r.rank}' : ''}',
                      style: TextStyle(color: Colors.grey.shade700)),
                  if (r.remark?.isNotEmpty == true)
                    Text(r.remark!,
                        style: TextStyle(
                            color: Colors.grey.shade600,
                            fontStyle: FontStyle.italic)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
