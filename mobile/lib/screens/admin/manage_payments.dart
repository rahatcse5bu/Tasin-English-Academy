import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Admin: review fee payments, filter by status, approve or reject.
class ManagePayments extends StatefulWidget {
  const ManagePayments({super.key});
  @override
  State<ManagePayments> createState() => _ManagePaymentsState();
}

class _ManagePaymentsState extends State<ManagePayments> {
  String? _status = 'pending';
  late Future<List<Payment>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Payment>> _load() =>
      context.read<AuthProvider>().api.payments(status: _status);

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _approve(Payment p) async {
    await runWithProgress(
        context, () => context.read<AuthProvider>().api.approvePayment(p.id),
        success: 'Approved');
    _refresh();
  }

  Future<void> _reject(Payment p) async {
    final note = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject payment'),
        content: TextField(
          controller: note,
          decoration: const InputDecoration(labelText: 'Reason (optional)'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Reject')),
        ],
      ),
    );
    if (ok == true && mounted) {
      await runWithProgress(
          context,
          () => context
              .read<AuthProvider>()
              .api
              .rejectPayment(p.id, note: note.text.trim()),
          success: 'Rejected');
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    const statuses = ['pending', 'approved', 'rejected', null];
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: statuses
                  .map((s) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(s == null ? 'All' : s.toUpperCase()),
                          selected: _status == s,
                          onSelected: (_) {
                            setState(() => _status = s);
                            _refresh();
                          },
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: FutureBuilder<List<Payment>>(
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
                          icon: Icons.payments_outlined,
                          message: 'No payments in this category.')
                    ]);
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final p = items[i];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Expanded(
                                  child: Text(
                                      '${p.studentName ?? 'Student'} • ${fmtMoney(p.amount)}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15)),
                                ),
                                StatusPill(p.status),
                              ]),
                              const SizedBox(height: 6),
                              Text(
                                  'Month: ${p.month}   •   ${p.method.toUpperCase()}'),
                              Text('TxID: ${p.transactionId}'),
                              Text('Sender: ${p.senderNumber}'),
                              if (p.note?.isNotEmpty == true)
                                Text('Note: ${p.note}',
                                    style: const TextStyle(
                                        fontStyle: FontStyle.italic)),
                              if (p.status == 'pending') ...[
                                const SizedBox(height: 10),
                                Row(children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _reject(p),
                                      icon: const Icon(Icons.close),
                                      label: const Text('Reject'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: FilledButton.icon(
                                      onPressed: () => _approve(p),
                                      icon: const Icon(Icons.check),
                                      label: const Text('Approve'),
                                    ),
                                  ),
                                ]),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
