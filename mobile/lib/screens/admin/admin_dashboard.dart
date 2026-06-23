import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'manage_payments.dart';
import 'manage_exams.dart';
import 'manage_classes.dart';
import 'manage_resources.dart';

/// Admin home: headline counts + pending payments to action + quick links.
class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});
  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  late Future<_AdminStats> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_AdminStats> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait([
      api.listStudents(),
      api.batches(all: true),
      api.payments(status: 'pending'),
      api.resources(),
    ]);
    return _AdminStats(
      students: (res[0] as List).length,
      batches: (res[1] as List).length,
      pendingPayments: (res[2] as List<Payment>),
      resources: (res[3] as List).length,
    );
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final name = context.watch<AuthProvider>().user?.name ?? 'Admin';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<_AdminStats>(
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
            final s = snap.data!;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Hello, $name 👋',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.45,
                  children: [
                    _statCard('${s.students}', 'Students',
                        Icons.people, AppTheme.seed),
                    _statCard('${s.batches}', 'Batches', Icons.groups,
                        AppTheme.accent),
                    _statCard('${s.resources}', 'Resources',
                        Icons.menu_book, const Color(0xFFE0930B)),
                    _statCard('${s.pendingPayments.length}', 'Pending Pay',
                        Icons.pending_actions, const Color(0xFFD64545)),
                  ],
                ),
                const SizedBox(height: 8),
                SectionHeader('Pending Payments',
                    trailing: TextButton(
                      onPressed: () => _push(context, const ManagePayments()),
                      child: const Text('Manage all'),
                    )),
                if (s.pendingPayments.isEmpty)
                  const Card(
                      child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('No payments awaiting review. ✅')))
                else
                  ...s.pendingPayments.take(4).map((p) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: const Icon(Icons.payments_outlined),
                          title: Text(
                              '${p.studentName ?? 'Student'} • ${fmtMoney(p.amount)}'),
                          subtitle: Text(
                              '${p.month} • ${p.method.toUpperCase()} • ${p.transactionId}'),
                          trailing: const StatusPill('pending'),
                          onTap: () => _push(context, const ManagePayments()),
                        ),
                      )),
                const SizedBox(height: 8),
                const SectionHeader('Quick Actions'),
                Card(
                  child: Column(children: [
                    _action(context, Icons.post_add, 'Share a resource',
                        const ManageResources()),
                    const Divider(height: 1),
                    _action(context, Icons.event_outlined, 'Schedule a class',
                        const ManageClasses()),
                    const Divider(height: 1),
                    _action(context, Icons.assignment_outlined,
                        'Create exam / enter results', const ManageExams()),
                  ]),
                ),
                const SizedBox(height: 20),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _statCard(String value, String label, IconData icon, Color color) =>
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 6),
            Text(value,
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w800)),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: Colors.grey.shade600)),
          ],
        ),
      );

  Widget _action(
          BuildContext context, IconData icon, String label, Widget page) =>
      ListTile(
        leading: Icon(icon, color: AppTheme.seed),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => _push(context, page),
      );

  void _push(BuildContext context, Widget page) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
}

class _AdminStats {
  final int students;
  final int batches;
  final List<Payment> pendingPayments;
  final int resources;
  _AdminStats(
      {required this.students,
      required this.batches,
      required this.pendingPayments,
      required this.resources});
}
