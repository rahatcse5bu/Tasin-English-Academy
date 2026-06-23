import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Student attendance: overall rate ring + per-class history.
class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late Future<({AttendanceStats stats, List<Attendance> records})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({AttendanceStats stats, List<Attendance> records})> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait([api.myAttendanceStats(), api.myAttendance()]);
    return (
      stats: res[0] as AttendanceStats,
      records: res[1] as List<Attendance>
    );
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<({AttendanceStats stats, List<Attendance> records})>(
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
            final stats = snap.data!.stats;
            final records = snap.data!.records;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 90,
                          height: 90,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              CircularProgressIndicator(
                                value: stats.rate / 100,
                                strokeWidth: 9,
                                backgroundColor: Colors.grey.shade200,
                                color: const Color(0xFF1B9C5A),
                              ),
                              Text('${stats.rate.toStringAsFixed(0)}%',
                                  style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _legend('Present', stats.present,
                                  const Color(0xFF1B9C5A)),
                              _legend('Late', stats.late,
                                  const Color(0xFFE0930B)),
                              _legend('Absent', stats.absent,
                                  const Color(0xFFD64545)),
                              const Divider(),
                              _legend('Total classes', stats.total,
                                  Colors.grey.shade700),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const SectionHeader('History'),
                if (records.isEmpty)
                  const EmptyState(
                      icon: Icons.fact_check_outlined,
                      message: 'No attendance records yet.')
                else
                  ...records.map((a) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Icon(
                            switch (a.status) {
                              'present' => Icons.check_circle,
                              'late' => Icons.timelapse,
                              _ => Icons.cancel,
                            },
                            color: AppTheme.statusColor(a.status),
                          ),
                          title: Text(a.status.toUpperCase()),
                          subtitle: a.remark?.isNotEmpty == true
                              ? Text(a.remark!)
                              : null,
                          trailing: StatusPill(a.status),
                        ),
                      )),
                const SizedBox(height: 20),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _legend(String label, int value, Color color) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            Container(
                width: 10,
                height: 10,
                decoration:
                    BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 8),
            Text(label),
            const Spacer(),
            Text('$value', style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      );
}
