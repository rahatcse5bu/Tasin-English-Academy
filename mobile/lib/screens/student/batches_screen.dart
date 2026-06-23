import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Browse all batches; enrolled ones are badged. Enrollment is handled by
/// the admin, so this screen guides students to request it.
class BatchesScreen extends StatefulWidget {
  const BatchesScreen({super.key});
  @override
  State<BatchesScreen> createState() => _BatchesScreenState();
}

class _BatchesScreenState extends State<BatchesScreen> {
  late Future<List<Batch>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AuthProvider>().api.batches();
  }

  Future<void> _refresh() async {
    setState(() {
      _future = context.read<AuthProvider>().api.batches();
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final enrolled = context.watch<AuthProvider>().user?.enrolledBatches.toSet() ?? {};
    return Scaffold(
      appBar: AppBar(title: const Text('Batches')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Batch>>(
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
              return const EmptyState(
                  icon: Icons.groups_outlined, message: 'No batches available.');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (_, i) =>
                  _BatchCard(items[i], enrolled: enrolled.contains(items[i].id)),
            );
          },
        ),
      ),
    );
  }
}

class _BatchCard extends StatelessWidget {
  final Batch b;
  final bool enrolled;
  const _BatchCard(this.b, {required this.enrolled});

  @override
  Widget build(BuildContext context) {
    final full = b.enrolledCount >= b.maxStudents;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(b.nameBn?.isNotEmpty == true ? b.nameBn! : b.name,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                if (enrolled)
                  const StatusPill('approved', label: 'Enrolled')
                else
                  StatusPill(b.type, label: b.type),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(spacing: 8, runSpacing: 4, children: [
              _chip(Icons.menu_book, b.subjectLabel),
              _chip(Icons.payments_outlined, '${fmtMoney(b.monthlyFee)}/mo'),
              _chip(Icons.groups, '${b.enrolledCount}/${b.maxStudents}'),
            ]),
            if (b.description?.isNotEmpty == true) ...[
              const SizedBox(height: 10),
              Text(b.descriptionBn?.isNotEmpty == true
                  ? b.descriptionBn!
                  : b.description!,
                  style: TextStyle(color: Colors.grey.shade700)),
            ],
            if (b.schedule.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(children: [
                Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                const SizedBox(width: 6),
                Expanded(
                    child: Text(b.schedule.map((s) => s.toString()).join('  •  '),
                        style: TextStyle(color: Colors.grey.shade700))),
              ]),
            ],
            const SizedBox(height: 12),
            if (enrolled)
              Row(children: [
                Icon(Icons.check_circle, color: AppTheme.statusColor('approved'), size: 18),
                const SizedBox(width: 6),
                const Text('You are enrolled in this batch'),
              ])
            else
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _showEnrollInfo(context, full),
                  icon: Icon(full ? Icons.block : Icons.how_to_reg_outlined),
                  label: Text(full ? 'Batch Full' : 'How to Enroll'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
            color: const Color(0xFFEEF1FA),
            borderRadius: BorderRadius.circular(20)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: AppTheme.seed),
          const SizedBox(width: 5),
          Text(text, style: const TextStyle(fontSize: 12)),
        ]),
      );

  void _showEnrollInfo(BuildContext context, bool full) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(b.name),
        content: Text(full
            ? 'This batch has reached its capacity of ${b.maxStudents} students.'
            : 'To join this batch, please contact the academy. The admin will '
                'enroll you, after which classes, resources and the Meet link '
                'will appear in your app.\n\nMonthly fee: ${fmtMoney(b.monthlyFee)}\n'
                'First ${b.freeClassCount} classes are free.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Got it')),
        ],
      ),
    );
  }
}
