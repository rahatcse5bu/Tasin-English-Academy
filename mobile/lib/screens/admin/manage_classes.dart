import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Admin CRUD for class sessions, filterable by batch.
class ManageClasses extends StatefulWidget {
  const ManageClasses({super.key});
  @override
  State<ManageClasses> createState() => _ManageClassesState();
}

class _ManageClassesState extends State<ManageClasses> {
  late Future<({List<ClassSession> classes, List<Batch> batches})> _future;
  String? _filterBatch;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<ClassSession> classes, List<Batch> batches})> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait(
        [api.classes(batch: _filterBatch), api.batches(all: true)]);
    final classes = (res[0] as List<ClassSession>)
      ..sort((a, b) => (b.scheduledAt ?? DateTime(0))
          .compareTo(a.scheduledAt ?? DateTime(0)));
    return (classes: classes, batches: res[1] as List<Batch>);
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _edit(List<Batch> batches, [ClassSession? c]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ClassForm(batches: batches, session: c),
    );
    if (saved == true) _refresh();
  }

  Future<void> _delete(ClassSession c) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete "${c.title}"?'),
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
          context, () => context.read<AuthProvider>().api.deleteClass(c.id),
          success: 'Deleted');
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<({List<ClassSession> classes, List<Batch> batches})>(
      future: _future,
      builder: (context, snap) {
        final batches = snap.data?.batches ?? [];
        return Scaffold(
          appBar: AppBar(title: const Text('Classes')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: snap.hasData ? () => _edit(batches) : null,
            icon: const Icon(Icons.add),
            label: const Text('New Class'),
          ),
          body: Column(
            children: [
              if (batches.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: DropdownButtonFormField<String?>(
                    initialValue: _filterBatch,
                    isExpanded: true,
                    decoration:
                        const InputDecoration(labelText: 'Filter by batch'),
                    items: [
                      const DropdownMenuItem(
                          value: null, child: Text('All batches')),
                      ...batches.map((b) =>
                          DropdownMenuItem(value: b.id, child: Text(b.name))),
                    ],
                    onChanged: (v) {
                      setState(() => _filterBatch = v);
                      _refresh();
                    },
                  ),
                ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _refresh,
                  child: Builder(builder: (context) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Loading();
                    }
                    if (snap.hasError) {
                      return ListView(children: [
                        EmptyState(message: '${snap.error}', onRetry: _refresh)
                      ]);
                    }
                    final items = snap.data!.classes;
                    if (items.isEmpty) {
                      return const EmptyState(
                          icon: Icons.event_busy,
                          message: 'No classes. Tap "New Class".');
                    }
                    return ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: items.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        final c = items[i];
                        final b = batches.firstWhere((e) => e.id == c.batchId,
                            orElse: () => batches.isNotEmpty
                                ? batches.first
                                : Batch(
                                    id: '',
                                    name: '—',
                                    code: '',
                                    type: 'general',
                                    subject: '',
                                    monthlyFee: 0,
                                    maxStudents: 0));
                        return Card(
                          child: ListTile(
                            title: Text(c.title),
                            subtitle: Text(
                                '${b.name}\n${fmtDateTime(c.scheduledAt)} • ${c.durationMinutes}min • ${c.status}'),
                            isThreeLine: true,
                            trailing: PopupMenuButton<String>(
                              onSelected: (v) =>
                                  v == 'edit' ? _edit(batches, c) : _delete(c),
                              itemBuilder: (_) => const [
                                PopupMenuItem(
                                    value: 'edit', child: Text('Edit')),
                                PopupMenuItem(
                                    value: 'delete', child: Text('Delete')),
                              ],
                            ),
                            onTap: () => _edit(batches, c),
                          ),
                        );
                      },
                    );
                  }),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ClassForm extends StatefulWidget {
  final List<Batch> batches;
  final ClassSession? session;
  const _ClassForm({required this.batches, this.session});
  @override
  State<_ClassForm> createState() => _ClassFormState();
}

class _ClassFormState extends State<_ClassForm> {
  final _form = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.session?.title);
  late final _titleBn = TextEditingController(text: widget.session?.titleBn);
  late final _topic = TextEditingController(text: widget.session?.topic);
  late final _duration = TextEditingController(
      text: (widget.session?.durationMinutes ?? 90).toString());
  late final _gmeet = TextEditingController(text: widget.session?.gmeetLink);
  late final _recording =
      TextEditingController(text: widget.session?.recordingUrl);
  late String? _batchId = widget.session?.batchId ??
      (widget.batches.isNotEmpty ? widget.batches.first.id : null);
  late String _status = widget.session?.status ?? 'scheduled';
  late DateTime _when =
      widget.session?.scheduledAt ?? DateTime.now().add(const Duration(days: 1));

  bool get _isEdit => widget.session != null;

  @override
  void dispose() {
    for (final c in [_title, _titleBn, _topic, _duration, _gmeet, _recording]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _when,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
        context: context, initialTime: TimeOfDay.fromDateTime(_when));
    if (t == null) return;
    setState(() =>
        _when = DateTime(d.year, d.month, d.day, t.hour, t.minute));
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    if (_batchId == null) {
      showToast(context, 'Create a batch first', error: true);
      return;
    }
    final body = {
      'batch': _batchId,
      'title': _title.text.trim(),
      'titleBn': _titleBn.text.trim(),
      'topic': _topic.text.trim(),
      'scheduledAt': _when.toUtc().toIso8601String(),
      'durationMinutes': int.tryParse(_duration.text) ?? 90,
      'status': _status,
      if (_gmeet.text.trim().isNotEmpty) 'gmeetLink': _gmeet.text.trim(),
      if (_recording.text.trim().isNotEmpty)
        'recordingUrl': _recording.text.trim(),
    };
    final api = context.read<AuthProvider>().api;
    final ok = await runWithProgress(
      context,
      () => _isEdit
          ? api.updateClass(widget.session!.id, body).then((_) {})
          : api.createClass(body).then((_) {}),
      success: _isEdit ? 'Updated' : 'Class scheduled',
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
            Text(_isEdit ? 'Edit Class' : 'New Class',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String?>(
              initialValue: _batchId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Batch'),
              items: widget.batches
                  .map((b) =>
                      DropdownMenuItem(value: b.id, child: Text(b.name)))
                  .toList(),
              onChanged: (v) => setState(() => _batchId = v),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
                controller: _titleBn,
                decoration:
                    const InputDecoration(labelText: 'Title (Bangla)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _topic,
                decoration: const InputDecoration(labelText: 'Topic')),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickWhen,
              icon: const Icon(Icons.schedule),
              label: Text(DateFormat('EEE, d MMM yyyy • h:mm a').format(_when)),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _duration,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Duration (min)'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(
                        value: 'scheduled', child: Text('Scheduled')),
                    DropdownMenuItem(value: 'live', child: Text('Live')),
                    DropdownMenuItem(
                        value: 'completed', child: Text('Completed')),
                    DropdownMenuItem(
                        value: 'cancelled', child: Text('Cancelled')),
                  ],
                  onChanged: (v) => setState(() => _status = v!),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
                controller: _gmeet,
                decoration: const InputDecoration(
                    labelText: 'Meet link (overrides batch link)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _recording,
                decoration:
                    const InputDecoration(labelText: 'Recording URL')),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }
}
