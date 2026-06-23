import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Admin: list students, search, and manage batch enrollment per student.
class ManageStudents extends StatefulWidget {
  const ManageStudents({super.key});
  @override
  State<ManageStudents> createState() => _ManageStudentsState();
}

class _ManageStudentsState extends State<ManageStudents> {
  late Future<({List<AppUser> students, List<Batch> batches})> _future;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<AppUser> students, List<Batch> batches})> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait([api.listStudents(), api.batches(all: true)]);
    return (
      students: res[0] as List<AppUser>,
      batches: res[1] as List<Batch>
    );
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Students')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                  hintText: 'Search by name or email',
                  prefixIcon: Icon(Icons.search)),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: FutureBuilder<({List<AppUser> students, List<Batch> batches})>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Loading();
                  }
                  if (snap.hasError) {
                    return EmptyState(
                        message: '${snap.error}', onRetry: _refresh);
                  }
                  final batches = snap.data!.batches;
                  final students = snap.data!.students
                      .where((s) =>
                          s.name.toLowerCase().contains(_query) ||
                          s.email.toLowerCase().contains(_query))
                      .toList();
                  if (students.isEmpty) {
                    return const EmptyState(
                        icon: Icons.people_outline,
                        message: 'No students found.');
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: students.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final s = students[i];
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppTheme.seed,
                            child: Text(
                                s.name.isNotEmpty
                                    ? s.name[0].toUpperCase()
                                    : '?',
                                style: const TextStyle(color: Colors.white)),
                          ),
                          title: Text(s.name),
                          subtitle: Text(
                              '${s.email}\n${s.level ?? '—'} • ${s.enrolledBatches.length} batch(es)'),
                          isThreeLine: true,
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _openStudent(s, batches),
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

  void _openStudent(AppUser student, List<Batch> batches) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _StudentSheet(
        student: student,
        batches: batches,
        onChanged: _refresh,
      ),
    );
  }
}

class _StudentSheet extends StatefulWidget {
  final AppUser student;
  final List<Batch> batches;
  final Future<void> Function() onChanged;
  const _StudentSheet(
      {required this.student, required this.batches, required this.onChanged});
  @override
  State<_StudentSheet> createState() => _StudentSheetState();
}

class _StudentSheetState extends State<_StudentSheet> {
  final Set<String> _enrolled = {};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _enrolled.addAll(widget.student.enrolledBatches);
  }

  Future<void> _toggle(Batch b, bool enroll) async {
    setState(() => _busy = true);
    final api = context.read<AuthProvider>().api;
    try {
      if (enroll) {
        await api.enroll(widget.student.id, b.id);
        _enrolled.add(b.id);
      } else {
        await api.unenroll(widget.student.id, b.id);
        _enrolled.remove(b.id);
      }
      await widget.onChanged();
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.student;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        children: [
          Text(s.name,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          Text(s.email, style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 6),
          Wrap(spacing: 8, children: [
            if (s.phone != null) Chip(label: Text(s.phone!)),
            if (s.institution != null) Chip(label: Text(s.institution!)),
            if (s.level != null) Chip(label: Text(s.level!)),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            const Text('Enrollment',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const Spacer(),
            if (_busy)
              const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2)),
          ]),
          const SizedBox(height: 8),
          ...widget.batches.map((b) {
            final on = _enrolled.contains(b.id);
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: SwitchListTile(
                value: on,
                onChanged: _busy ? null : (v) => _toggle(b, v),
                title: Text(b.name),
                subtitle: Text(
                    '${b.subjectLabel} • ${fmtMoney(b.monthlyFee)}/mo • ${b.enrolledCount}/${b.maxStudents}'),
              ),
            );
          }),
        ],
      ),
    );
  }
}
