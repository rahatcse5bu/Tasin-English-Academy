import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// A smart, client-side notification feed. The backend has no notification
/// API, so this synthesizes a timeline from the student's real data:
///   • upcoming classes (next 7 days)
///   • newly shared resources / suggestions
///   • published exam results
///   • payment status changes (pending / rejected need action)
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<AppNotification>> _future;

  @override
  void initState() {
    super.initState();
    _future = _build();
  }

  Future<List<AppNotification>> _build() async {
    final auth = context.read<AuthProvider>();
    final api = auth.api;
    final enrolled = auth.user?.enrolledBatches.toSet() ?? {};
    final res = await Future.wait([
      api.classes(),
      api.resources(),
      api.myResults(),
      api.myPayments(),
      api.exams(),
    ]);
    final now = DateTime.now();
    final out = <AppNotification>[];

    // Upcoming classes within 7 days.
    for (final c in (res[0] as List<ClassSession>)) {
      if (!enrolled.contains(c.batchId) || c.scheduledAt == null) continue;
      final diff = c.scheduledAt!.difference(now);
      if (diff.inMinutes >= -30 && diff.inDays <= 7) {
        out.add(AppNotification(
          type: NotifType.classUpcoming,
          title: c.status == 'live' ? '🔴 Class is live now' : 'Upcoming class',
          body: '${c.title} • ${fmtDateTime(c.scheduledAt)}',
          when: c.scheduledAt,
          icon: IconKey.classroom,
        ));
      }
    }

    // Recently shared resources (last 14 days).
    for (final r in (res[1] as List<Resource>)) {
      if (r.createdAt != null && now.difference(r.createdAt!).inDays <= 14) {
        out.add(AppNotification(
          type: NotifType.resource,
          title: 'New ${r.kindLabel.toLowerCase()} shared',
          body: r.titleBn?.isNotEmpty == true ? r.titleBn! : r.title,
          when: r.createdAt,
          icon: IconKey.book,
        ));
      }
    }

    // Exam results.
    for (final er in (res[2] as List<ExamResult>)) {
      out.add(AppNotification(
        type: NotifType.examResult,
        title: 'Result published',
        body:
            '${er.exam?.title ?? 'Exam'}: ${er.marks.toStringAsFixed(0)}/${er.totalMarks.toStringAsFixed(0)}'
            '${er.rank != null ? ' (Rank #${er.rank})' : ''}',
        when: er.exam?.scheduledAt,
        icon: IconKey.trophy,
      ));
    }

    // Payment status that needs attention.
    for (final p in (res[3] as List<Payment>)) {
      if (p.status == 'pending' || p.status == 'rejected') {
        out.add(AppNotification(
          type: NotifType.payment,
          title: p.status == 'pending'
              ? 'Payment under review'
              : 'Payment rejected',
          body:
              '${fmtMoney(p.amount)} for ${p.month}${p.note?.isNotEmpty == true ? ' — ${p.note}' : ''}',
          when: p.createdAt,
          icon: IconKey.money,
        ));
      }
    }

    // Open exams to sit.
    for (final e in (res[4] as List<Exam>)) {
      if (enrolled.contains(e.batchId) && e.status == 'open') {
        out.add(AppNotification(
          type: NotifType.exam,
          title: 'Exam open now',
          body: '${e.title} • ${e.totalMarks} marks',
          when: e.scheduledAt,
          icon: IconKey.edit,
        ));
      }
    }

    out.sort((a, b) =>
        (b.when ?? now).compareTo(a.when ?? now));
    return out;
  }

  Future<void> _refresh() async {
    setState(() { _future = _build(); });
    await _future;
  }

  IconData _iconFor(IconKey k) => switch (k) {
        IconKey.classroom => Icons.video_camera_front,
        IconKey.book => Icons.menu_book,
        IconKey.trophy => Icons.emoji_events,
        IconKey.money => Icons.payments,
        IconKey.edit => Icons.edit_note,
        IconKey.bell => Icons.notifications,
      };

  Color _colorFor(NotifType t) => switch (t) {
        NotifType.classUpcoming => AppTheme.seed,
        NotifType.resource => AppTheme.accent,
        NotifType.examResult => const Color(0xFFE0930B),
        NotifType.payment => const Color(0xFFD64545),
        NotifType.exam => const Color(0xFF2563EB),
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<AppNotification>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Loading();
            }
            if (snap.hasError) {
              return ListView(children: [
                EmptyState(message: '${snap.error}', onRetry: _refresh)
              ]);
            }
            final items = snap.data ?? [];
            if (items.isEmpty) {
              return ListView(children: const [
                EmptyState(
                    icon: Icons.notifications_none,
                    message: 'You are all caught up!')
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final n = items[i];
                final color = _colorFor(n.type);
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: color.withValues(alpha: 0.12),
                      child: Icon(_iconFor(n.icon), color: color),
                    ),
                    title: Text(n.title,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(n.body),
                    trailing: n.when == null
                        ? null
                        : Text(fmtDate(n.when),
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey.shade500)),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
