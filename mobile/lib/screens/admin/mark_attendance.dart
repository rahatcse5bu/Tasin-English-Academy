import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Admin: pick a batch + class, then mark each enrolled student
/// present / late / absent and submit in one batch.
class MarkAttendanceScreen extends StatefulWidget {
  const MarkAttendanceScreen({super.key});
  @override
  State<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends State<MarkAttendanceScreen> {
  late Future<List<Batch>> _batches;
  Batch? _batch;
  List<ClassSession> _classes = [];
  ClassSession? _class;
  List<AppUser> _students = [];
  final Map<String, String> _status = {}; // studentId -> status
  bool _loadingRoster = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _batches = context.read<AuthProvider>().api.batches(all: true);
  }

  Future<void> _selectBatch(Batch b) async {
    setState(() {
      _batch = b;
      _class = null;
      _classes = [];
      _students = [];
      _status.clear();
      _loadingRoster = true;
    });
    final api = context.read<AuthProvider>().api;
    try {
      final res = await Future.wait([api.classes(batch: b.id), api.listStudents()]);
      final classes = (res[0] as List<ClassSession>)
        ..sort((a, b) => (b.scheduledAt ?? DateTime(0))
            .compareTo(a.scheduledAt ?? DateTime(0)));
      final students = (res[1] as List<AppUser>)
          .where((s) => s.enrolledBatches.contains(b.id))
          .toList();
      setState(() {
        _classes = classes;
        _students = students;
        for (final s in students) {
          _status[s.id] = 'present';
        }
      });
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _loadingRoster = false);
    }
  }

  Future<void> _submit() async {
    if (_class == null || _batch == null) {
      showToast(context, 'Pick a batch and class first', error: true);
      return;
    }
    setState(() => _saving = true);
    final records = _students
        .map((s) => {
              'classSession': _class!.id,
              'batch': _batch!.id,
              'student': s.id,
              'status': _status[s.id] ?? 'absent',
            })
        .toList();
    try {
      await context.read<AuthProvider>().api.markAttendance(records);
      if (mounted) {
        showToast(context, 'Attendance saved for ${records.length} students');
      }
    } catch (e) {
      if (mounted) showToast(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mark Attendance')),
      floatingActionButton: _students.isEmpty
          ? null
          : FloatingActionButton.extended(
              onPressed: _saving ? null : _submit,
              icon: _saving
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save),
              label: const Text('Save'),
            ),
      body: FutureBuilder<List<Batch>>(
        future: _batches,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          final batches = snap.data ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              DropdownButtonFormField<Batch>(
                initialValue: _batch,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Batch'),
                items: batches
                    .map((b) =>
                        DropdownMenuItem(value: b, child: Text(b.name)))
                    .toList(),
                onChanged: (b) => b == null ? null : _selectBatch(b),
              ),
              const SizedBox(height: 12),
              if (_batch != null)
                DropdownButtonFormField<ClassSession>(
                  initialValue: _class,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Class'),
                  items: _classes
                      .map((c) => DropdownMenuItem(
                          value: c,
                          child: Text('${c.title} • ${fmtDate(c.scheduledAt)}',
                              overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (c) => setState(() => _class = c),
                ),
              const SizedBox(height: 16),
              if (_loadingRoster)
                const Loading()
              else if (_batch != null && _students.isEmpty)
                const EmptyState(
                    icon: Icons.people_outline,
                    message: 'No students enrolled in this batch.')
              else if (_class == null && _students.isNotEmpty)
                const EmptyState(
                    icon: Icons.event_note,
                    message: 'Select a class to mark attendance.')
              else
                ..._students.map((s) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Expanded(
                                child: Text(s.name,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600))),
                            _segment(s.id),
                          ],
                        ),
                      ),
                    )),
              const SizedBox(height: 80),
            ],
          );
        },
      ),
    );
  }

  Widget _segment(String studentId) {
    final current = _status[studentId] ?? 'present';
    Widget btn(String value, IconData icon) {
      final on = current == value;
      final color = AppTheme.statusColor(value);
      return InkWell(
        onTap: () => setState(() => _status[studentId] = value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: on ? color.withValues(alpha: 0.15) : null,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: on ? color : Colors.grey, size: 22),
        ),
      );
    }

    return Row(mainAxisSize: MainAxisSize.min, children: [
      btn('present', Icons.check_circle),
      btn('late', Icons.timelapse),
      btn('absent', Icons.cancel),
    ]);
  }
}
