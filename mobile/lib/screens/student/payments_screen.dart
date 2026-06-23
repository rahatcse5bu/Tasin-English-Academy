import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Student fee payments: history + submit a new payment for review.
class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});
  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  late Future<List<Payment>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Payment>> _load() => context.read<AuthProvider>().api.myPayments();

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    final enrolledIds = auth.user?.enrolledBatches ?? [];
    if (enrolledIds.isEmpty) {
      showToast(context,
          'You are not enrolled in any batch yet. Contact admin to enroll.',
          error: true);
      return;
    }
    final batches = (await auth.api.batches(all: true))
        .where((b) => enrolledIds.contains(b.id))
        .toList();
    if (!mounted) return;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _PaymentForm(batches: batches),
    );
    if (created == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _submit,
        icon: const Icon(Icons.add),
        label: const Text('Pay Fee'),
      ),
      body: RefreshIndicator(
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
                    message: 'No payments yet.\nTap "Pay Fee" to submit one.')
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final p = items[i];
                return Card(
                  child: ListTile(
                    title: Text('${fmtMoney(p.amount)}  •  ${p.month}'),
                    subtitle: Text(
                        '${p.method.toUpperCase()}  •  TxID: ${p.transactionId}'),
                    trailing: StatusPill(p.status),
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

class _PaymentForm extends StatefulWidget {
  final List<Batch> batches;
  const _PaymentForm({required this.batches});
  @override
  State<_PaymentForm> createState() => _PaymentFormState();
}

class _PaymentFormState extends State<_PaymentForm> {
  final _form = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _txId = TextEditingController();
  final _sender = TextEditingController();
  late String _batchId = widget.batches.first.id;
  String _method = 'bkash';
  late String _month = DateFormat('yyyy-MM').format(DateTime.now());

  @override
  void initState() {
    super.initState();
    _amount.text = widget.batches.first.monthlyFee.toStringAsFixed(0);
  }

  @override
  void dispose() {
    _amount.dispose();
    _txId.dispose();
    _sender.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final ok = await runWithProgress(
      context,
      () => context.read<AuthProvider>().api.createPayment({
        'batch': _batchId,
        'amount': num.tryParse(_amount.text) ?? 0,
        'month': _month,
        'method': _method,
        'transactionId': _txId.text.trim(),
        'senderNumber': _sender.text.trim(),
      }).then((_) {}),
      success: 'Payment submitted for review',
    );
    if (ok && mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final months = List.generate(6, (i) {
      final d = DateTime(DateTime.now().year, DateTime.now().month - i);
      return DateFormat('yyyy-MM').format(d);
    });
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Form(
        key: _form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Submit Payment',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _batchId,
              decoration: const InputDecoration(labelText: 'Batch'),
              items: widget.batches
                  .map((b) =>
                      DropdownMenuItem(value: b.id, child: Text(b.name)))
                  .toList(),
              onChanged: (v) {
                final b = widget.batches.firstWhere((e) => e.id == v);
                setState(() {
                  _batchId = v!;
                  _amount.text = b.monthlyFee.toStringAsFixed(0);
                });
              },
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _month,
                  decoration: const InputDecoration(labelText: 'Month'),
                  items: months
                      .map((m) =>
                          DropdownMenuItem(value: m, child: Text(m)))
                      .toList(),
                  onChanged: (v) => setState(() => _month = v!),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _amount,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Amount (৳)'),
                  validator: (v) =>
                      (num.tryParse(v ?? '') == null) ? 'Invalid' : null,
                ),
              ),
            ]),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _method,
              decoration: const InputDecoration(labelText: 'Method'),
              items: const ['bkash', 'nagad', 'rocket', 'cash']
                  .map((m) =>
                      DropdownMenuItem(value: m, child: Text(m.toUpperCase())))
                  .toList(),
              onChanged: (v) => setState(() => _method = v!),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _txId,
              decoration:
                  const InputDecoration(labelText: 'Transaction ID'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _sender,
              keyboardType: TextInputType.phone,
              decoration:
                  const InputDecoration(labelText: 'Sender number'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Submit')),
          ],
        ),
      ),
    );
  }
}
