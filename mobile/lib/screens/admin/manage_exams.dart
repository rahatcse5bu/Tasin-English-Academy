import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

/// Admin CRUD for exams, plus per-exam results entry.
class ManageExams extends StatefulWidget {
  const ManageExams({super.key});
  @override
  State<ManageExams> createState() => _ManageExamsState();
}

class _ManageExamsState extends State<ManageExams> {
  late Future<({List<Exam> exams, List<Batch> batches})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<Exam> exams, List<Batch> batches})> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait([api.exams(), api.batches(all: true)]);
    return (exams: res[0] as List<Exam>, batches: res[1] as List<Batch>);
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _edit(List<Batch> batches, [Exam? e]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ExamForm(batches: batches, exam: e),
    );
    if (saved == true) _refresh();
  }

  Future<void> _delete(Exam e) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete "${e.title}"?'),
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
          context, () => context.read<AuthProvider>().api.deleteExam(e.id),
          success: 'Deleted');
      _refresh();
    }
  }

  void _enterResults(Exam e) => Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ExamResultsScreen(exam: e)));

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<({List<Exam> exams, List<Batch> batches})>(
      future: _future,
      builder: (context, snap) {
        final batches = snap.data?.batches ?? [];
        return Scaffold(
          appBar: AppBar(title: const Text('Exams')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: snap.hasData ? () => _edit(batches) : null,
            icon: const Icon(Icons.add),
            label: const Text('New Exam'),
          ),
          body: RefreshIndicator(
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
              final items = snap.data!.exams;
              if (items.isEmpty) {
                return const EmptyState(
                    icon: Icons.assignment_outlined,
                    message: 'No exams. Tap "New Exam".');
              }
              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final e = items[i];
                  return Card(
                    child: Column(
                      children: [
                        ListTile(
                          title: Text(e.title),
                          subtitle: Text(
                              '${fmtDateTime(e.scheduledAt)} • ${e.totalMarks} marks • ${e.status}'),
                          trailing: PopupMenuButton<String>(
                            onSelected: (v) =>
                                v == 'edit' ? _edit(batches, e) : _delete(e),
                            itemBuilder: (_) => const [
                              PopupMenuItem(value: 'edit', child: Text('Edit')),
                              PopupMenuItem(
                                  value: 'delete', child: Text('Delete')),
                            ],
                          ),
                        ),
                        const Divider(height: 1),
                        TextButton.icon(
                          onPressed: () => _enterResults(e),
                          icon: const Icon(Icons.grading),
                          label: const Text('Enter / view results'),
                        ),
                      ],
                    ),
                  );
                },
              );
            }),
          ),
        );
      },
    );
  }
}

class _ExamForm extends StatefulWidget {
  final List<Batch> batches;
  final Exam? exam;
  const _ExamForm({required this.batches, this.exam});
  @override
  State<_ExamForm> createState() => _ExamFormState();
}

class _ExamFormState extends State<_ExamForm> {
  final _form = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.exam?.title);
  late final _titleBn = TextEditingController(text: widget.exam?.titleBn);
  late final _marks =
      TextEditingController(text: (widget.exam?.totalMarks ?? 100).toString());
  late final _form_ = TextEditingController(text: widget.exam?.googleFormUrl);
  late String? _batchId = widget.exam?.batchId ??
      (widget.batches.isNotEmpty ? widget.batches.first.id : null);
  late String _status = widget.exam?.status ?? 'scheduled';
  late DateTime _when =
      widget.exam?.scheduledAt ?? DateTime.now().add(const Duration(days: 1));

  bool get _isEdit => widget.exam != null;

  @override
  void dispose() {
    for (final c in [_title, _titleBn, _marks, _form_]) {
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
    setState(() => _when = DateTime(d.year, d.month, d.day, t.hour, t.minute));
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
      'scheduledAt': _when.toUtc().toIso8601String(),
      'totalMarks': int.tryParse(_marks.text) ?? 100,
      'status': _status,
      if (_form_.text.trim().isNotEmpty) 'googleFormUrl': _form_.text.trim(),
    };
    final api = context.read<AuthProvider>().api;
    final ok = await runWithProgress(
      context,
      () => _isEdit
          ? api.updateExam(widget.exam!.id, body).then((_) {})
          : api.createExam(body).then((_) {}),
      success: _isEdit ? 'Updated' : 'Exam created',
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
            Text(_isEdit ? 'Edit Exam' : 'New Exam',
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
            OutlinedButton.icon(
              onPressed: _pickWhen,
              icon: const Icon(Icons.schedule),
              label: Text(DateFormat('EEE, d MMM yyyy • h:mm a').format(_when)),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _marks,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Total marks'),
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
                    DropdownMenuItem(value: 'open', child: Text('Open')),
                    DropdownMenuItem(value: 'closed', child: Text('Closed')),
                    DropdownMenuItem(
                        value: 'evaluated', child: Text('Evaluated')),
                  ],
                  onChanged: (v) => setState(() => _status = v!),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
                controller: _form_,
                decoration: const InputDecoration(
                    labelText: 'Google Form URL (for students to sit exam)')),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }
}

/// Enter / review marks for every enrolled student of an exam's batch.
class ExamResultsScreen extends StatefulWidget {
  final Exam exam;
  const ExamResultsScreen({super.key, required this.exam});
  @override
  State<ExamResultsScreen> createState() => _ExamResultsScreenState();
}

class _ExamResultsScreenState extends State<ExamResultsScreen> {
  late Future<List<_Row>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<_Row>> _load() async {
    final api = context.read<AuthProvider>().api;
    final students = await api.listStudents();
    final results = await api.examResults(widget.exam.id);
    final byStudent = {for (final r in results) r.studentId: r};
    final enrolled = students
        .where((s) => s.enrolledBatches.contains(widget.exam.batchId))
        .toList();
    // Fall back to all students if none are enrolled (e.g. data mismatch).
    final list = enrolled.isNotEmpty ? enrolled : students;
    return list
        .map((s) => _Row(
              student: s,
              marks: byStudent[s.id]?.marks,
              rank: byStudent[s.id]?.rank,
            ))
        .toList();
  }

  Future<void> _save(_Row row, String value) async {
    final marks = double.tryParse(value);
    if (marks == null) return;
    try {
      await context.read<AuthProvider>().api.addResult(widget.exam.id, {
        'student': row.student.id,
        'batch': widget.exam.batchId,
        'marks': marks,
        'totalMarks': widget.exam.totalMarks,
      });
      if (mounted) showToast(context, 'Saved ${row.student.name}');
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Results • ${widget.exam.title}')),
      body: FutureBuilder<List<_Row>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError) {
            return EmptyState(
                message: '${snap.error}',
                onRetry: () => setState(() { _future = _load(); }));
          }
          final rows = snap.data ?? [];
          if (rows.isEmpty) {
            return const EmptyState(
                icon: Icons.people_outline,
                message: 'No enrolled students to grade.');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: rows.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final r = rows[i];
              final ctrl = TextEditingController(
                  text: r.marks?.toStringAsFixed(0) ?? '');
              return Card(
                child: ListTile(
                  title: Text(r.student.name),
                  subtitle: Text(r.rank != null
                      ? 'Rank #${r.rank}'
                      : r.student.email),
                  trailing: SizedBox(
                    width: 110,
                    child: TextField(
                      controller: ctrl,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      decoration: InputDecoration(
                        isDense: true,
                        suffixText: '/${widget.exam.totalMarks}',
                      ),
                      onSubmitted: (v) => _save(r, v),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _Row {
  final AppUser student;
  final double? marks;
  final int? rank;
  _Row({required this.student, this.marks, this.rank});
}
