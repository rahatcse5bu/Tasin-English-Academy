import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Student's class timeline across all enrolled batches, split into
/// Upcoming and Past. Join button surfaces the Meet link (enrolled only).
class ClassesScreen extends StatefulWidget {
  const ClassesScreen({super.key});
  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  late Future<List<ClassSession>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<ClassSession>> _load() async {
    final auth = context.read<AuthProvider>();
    final enrolled = auth.user?.enrolledBatches.toSet() ?? {};
    final all = await auth.api.classes();
    final mine = all.where((c) => enrolled.contains(c.batchId)).toList();
    // Fetch authed copies to obtain Meet links for enrolled batches.
    final detailed = await Future.wait(mine.map((c) async {
      try {
        return await auth.api.classAuth(c.id);
      } catch (_) {
        return c;
      }
    }));
    detailed.sort((a, b) => (a.scheduledAt ?? DateTime(0))
        .compareTo(b.scheduledAt ?? DateTime(0)));
    return detailed;
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Classes')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<ClassSession>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Loading();
            }
            if (snap.hasError) {
              return ListView(children: [
                EmptyState(
                    icon: Icons.cloud_off,
                    message: '${snap.error}',
                    onRetry: _refresh)
              ]);
            }
            final all = snap.data ?? [];
            if (all.isEmpty) {
              return ListView(children: const [
                EmptyState(
                    icon: Icons.video_camera_front_outlined,
                    message:
                        'No classes yet.\nEnroll in a batch to see your schedule.')
              ]);
            }
            final now = DateTime.now();
            final upcoming = all
                .where((c) =>
                    (c.scheduledAt ?? now).isAfter(now) && c.status != 'completed')
                .toList();
            final past = all.reversed
                .where((c) =>
                    !((c.scheduledAt ?? now).isAfter(now) &&
                        c.status != 'completed'))
                .toList();
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (upcoming.isNotEmpty) const SectionHeader('Upcoming'),
                ...upcoming.map((c) => _ClassCard(c, upcoming: true)),
                if (past.isNotEmpty) const SectionHeader('Past'),
                ...past.map((c) => _ClassCard(c, upcoming: false)),
                const SizedBox(height: 20),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  final ClassSession c;
  final bool upcoming;
  const _ClassCard(this.c, {required this.upcoming});

  @override
  Widget build(BuildContext context) {
    final isLive = c.status == 'live';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                      c.titleBn?.isNotEmpty == true ? c.titleBn! : c.title,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                StatusPill(c.status),
              ],
            ),
            if (c.topic?.isNotEmpty == true) ...[
              const SizedBox(height: 4),
              Text(c.topicBn?.isNotEmpty == true ? c.topicBn! : c.topic!,
                  style: TextStyle(color: Colors.grey.shade600)),
            ],
            const SizedBox(height: 10),
            Row(children: [
              Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text(fmtDateTime(c.scheduledAt)),
              const SizedBox(width: 14),
              Icon(Icons.timelapse, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              Text('${c.durationMinutes} min'),
            ]),
            if (upcoming || isLive) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: isLive
                      ? FilledButton.styleFrom(
                          backgroundColor: AppTheme.statusColor('live'))
                      : null,
                  onPressed: () => openUrl(context, c.gmeetLink),
                  icon: const Icon(Icons.videocam),
                  label: Text(isLive ? 'Join Live Now' : 'Join Google Meet'),
                ),
              ),
            ],
            if (c.recordingUrl?.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => openUrl(context, c.recordingUrl),
                  icon: const Icon(Icons.play_circle_outline),
                  label: const Text('Watch Recording'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
