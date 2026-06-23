import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';

/// Admin CRUD for teacher profiles (shown publicly on the marketing site).
class ManageTeachers extends StatefulWidget {
  const ManageTeachers({super.key});
  @override
  State<ManageTeachers> createState() => _ManageTeachersState();
}

class _ManageTeachersState extends State<ManageTeachers> {
  late Future<List<Teacher>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Teacher>> _load() => context.read<AuthProvider>().api.teachers();

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _edit([Teacher? t]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _TeacherForm(teacher: t),
    );
    if (saved == true) _refresh();
  }

  Future<void> _delete(Teacher t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete ${t.name}?'),
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
          context, () => context.read<AuthProvider>().api.deleteTeacher(t.id),
          success: 'Deleted');
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Teachers')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(),
        icon: const Icon(Icons.add),
        label: const Text('New Teacher'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Teacher>>(
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
                  icon: Icons.person_outline,
                  message: 'No teachers yet. Tap "New Teacher".');
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final t = items[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppTheme.accent,
                      child: Text(t.name.isNotEmpty ? t.name[0] : '?',
                          style: const TextStyle(color: Colors.white)),
                    ),
                    title: Text(t.name),
                    subtitle: Text(
                        '${t.designation}\n${t.subjects.join(', ')}'),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (v) => v == 'edit' ? _edit(t) : _delete(t),
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                    onTap: () => _edit(t),
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

class _TeacherForm extends StatefulWidget {
  final Teacher? teacher;
  const _TeacherForm({this.teacher});
  @override
  State<_TeacherForm> createState() => _TeacherFormState();
}

class _TeacherFormState extends State<_TeacherForm> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.teacher?.name);
  late final _designation =
      TextEditingController(text: widget.teacher?.designation);
  late final _bio = TextEditingController(text: widget.teacher?.bio);
  late final _subjects =
      TextEditingController(text: widget.teacher?.subjects.join(', '));
  late final _qualification =
      TextEditingController(text: widget.teacher?.qualification);
  late final _experience = TextEditingController(
      text: widget.teacher?.experienceYears?.toString());
  late final _photo = TextEditingController(text: widget.teacher?.photoUrl);

  bool get _isEdit => widget.teacher != null;

  @override
  void dispose() {
    for (final c in [
      _name,
      _designation,
      _bio,
      _subjects,
      _qualification,
      _experience,
      _photo
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final body = {
      'name': _name.text.trim(),
      'designation': _designation.text.trim(),
      'bio': _bio.text.trim(),
      'subjects': _subjects.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList(),
      'qualification': _qualification.text.trim(),
      if (_experience.text.trim().isNotEmpty)
        'experienceYears': int.tryParse(_experience.text) ?? 0,
      if (_photo.text.trim().isNotEmpty) 'photoUrl': _photo.text.trim(),
    };
    final api = context.read<AuthProvider>().api;
    final ok = await runWithProgress(
      context,
      () => _isEdit
          ? api.updateTeacher(widget.teacher!.id, body).then((_) {})
          : api.createTeacher(body).then((_) {}),
      success: _isEdit ? 'Updated' : 'Teacher added',
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
            Text(_isEdit ? 'Edit Teacher' : 'New Teacher',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _designation,
              decoration: const InputDecoration(labelText: 'Designation'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
                controller: _subjects,
                decoration: const InputDecoration(
                    labelText: 'Subjects (comma separated)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _qualification,
                decoration: const InputDecoration(labelText: 'Qualification')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _experience,
                keyboardType: TextInputType.number,
                decoration:
                    const InputDecoration(labelText: 'Experience (years)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _bio,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Bio')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _photo,
                decoration: const InputDecoration(labelText: 'Photo URL')),
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }
}
