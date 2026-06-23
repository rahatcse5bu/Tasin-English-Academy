import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Admin CRUD for batches.
class ManageBatches extends StatefulWidget {
  const ManageBatches({super.key});
  @override
  State<ManageBatches> createState() => _ManageBatchesState();
}

class _ManageBatchesState extends State<ManageBatches> {
  late Future<List<Batch>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Batch>> _load() =>
      context.read<AuthProvider>().api.batches(all: true);

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _edit([Batch? b]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _BatchForm(batch: b),
    );
    if (saved == true) _refresh();
  }

  Future<void> _delete(Batch b) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete ${b.name}?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete')),
        ],
      ),
    );
    if (ok == true && mounted) {
      await runWithProgress(
          context, () => context.read<AuthProvider>().api.deleteBatch(b.id),
          success: 'Batch deleted');
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Batches')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(),
        icon: const Icon(Icons.add),
        label: const Text('New Batch'),
      ),
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
                  icon: Icons.groups_outlined,
                  message: 'No batches yet. Tap "New Batch".');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final b = items[i];
                return Card(
                  child: ListTile(
                    title: Text(b.name),
                    subtitle: Text(
                        '${b.code} • ${b.subjectLabel}\n${fmtMoney(b.monthlyFee)}/mo • ${b.enrolledCount}/${b.maxStudents} • ${b.type}'),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (v) =>
                          v == 'edit' ? _edit(b) : _delete(b),
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                    onTap: () => _edit(b),
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

class _BatchForm extends StatefulWidget {
  final Batch? batch;
  const _BatchForm({this.batch});
  @override
  State<_BatchForm> createState() => _BatchFormState();
}

class _BatchFormState extends State<_BatchForm> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.batch?.name);
  late final _nameBn = TextEditingController(text: widget.batch?.nameBn);
  late final _code = TextEditingController(text: widget.batch?.code);
  late final _fee =
      TextEditingController(text: widget.batch?.monthlyFee.toStringAsFixed(0));
  late final _max =
      TextEditingController(text: widget.batch?.maxStudents.toString());
  late final _desc = TextEditingController(text: widget.batch?.description);
  late final _gmeet = TextEditingController(text: widget.batch?.gmeetLink);
  late String _type = widget.batch?.type ?? 'general';
  late String _subject = widget.batch?.subject ?? 'HSC_ENGLISH_1ST';

  bool get _isEdit => widget.batch != null;

  @override
  void dispose() {
    for (final c in [_name, _nameBn, _code, _fee, _max, _desc, _gmeet]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final body = {
      'name': _name.text.trim(),
      'nameBn': _nameBn.text.trim(),
      'code': _code.text.trim(),
      'type': _type,
      'subject': _subject,
      'description': _desc.text.trim(),
      'monthlyFee': num.tryParse(_fee.text) ?? 0,
      'maxStudents': int.tryParse(_max.text) ?? (_type == 'premium' ? 10 : 30),
      if (_gmeet.text.trim().isNotEmpty) 'gmeetLink': _gmeet.text.trim(),
    };
    final api = context.read<AuthProvider>().api;
    final ok = await runWithProgress(
      context,
      () => _isEdit
          ? api.updateBatch(widget.batch!.id, body).then((_) {})
          : api.createBatch(body).then((_) {}),
      success: _isEdit ? 'Batch updated' : 'Batch created',
    );
    if (ok && mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Form(
        key: _form,
        child: ListView(
          shrinkWrap: true,
          children: [
            Text(_isEdit ? 'Edit Batch' : 'New Batch',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            _field(_name, 'Name (English)', required: true),
            _field(_nameBn, 'Name (Bangla)'),
            _field(_code, 'Code (unique)', required: true),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: const [
                    DropdownMenuItem(value: 'general', child: Text('General')),
                    DropdownMenuItem(value: 'premium', child: Text('Premium')),
                  ],
                  onChanged: (v) => setState(() => _type = v!),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _subject,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Subject'),
                  items: const [
                    DropdownMenuItem(
                        value: 'HSC_ENGLISH_1ST', child: Text('HSC Eng 1st')),
                    DropdownMenuItem(
                        value: 'HSC_ENGLISH_2ND', child: Text('HSC Eng 2nd')),
                    DropdownMenuItem(
                        value: 'SSC_ENGLISH_1ST', child: Text('SSC Eng 1st')),
                    DropdownMenuItem(
                        value: 'SSC_ENGLISH_2ND', child: Text('SSC Eng 2nd')),
                    DropdownMenuItem(value: 'ICT', child: Text('ICT')),
                  ],
                  onChanged: (v) => setState(() => _subject = v!),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                  child: _field(_fee, 'Monthly Fee (৳)',
                      number: true, required: true)),
              const SizedBox(width: 12),
              Expanded(child: _field(_max, 'Max Students', number: true)),
            ]),
            _field(_desc, 'Description', lines: 2),
            _field(_gmeet, 'Google Meet link'),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label,
      {bool required = false, bool number = false, int lines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: c,
        maxLines: lines,
        keyboardType: number ? TextInputType.number : TextInputType.text,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
            : null,
      ),
    );
  }
}
