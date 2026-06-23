import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../widgets/common.dart';

const _kindOptions = <String, String>{
  'suggestion': 'Suggestion',
  'hack': 'Hack',
  'tips': 'Tips',
  'best_practice': 'Best Practice',
  'lecture_sheet': 'Lecture Sheet',
  'note': 'Note',
};

/// Admin: create / edit / delete the materials shared with students.
/// Each item can be public (visitors) or scoped to a specific batch.
class ManageResources extends StatefulWidget {
  const ManageResources({super.key});
  @override
  State<ManageResources> createState() => _ManageResourcesState();
}

class _ManageResourcesState extends State<ManageResources> {
  late Future<({List<Resource> resources, List<Batch> batches})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<Resource> resources, List<Batch> batches})> _load() async {
    final api = context.read<AuthProvider>().api;
    final res = await Future.wait([api.resources(), api.batches(all: true)]);
    return (
      resources: res[0] as List<Resource>,
      batches: res[1] as List<Batch>
    );
  }

  Future<void> _refresh() async {
    setState(() { _future = _load(); });
    await _future;
  }

  Future<void> _edit(List<Batch> batches, [Resource? r]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _ResourceForm(batches: batches, resource: r),
    );
    if (saved == true) _refresh();
  }

  Future<void> _delete(Resource r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Delete "${r.title}"?'),
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
      await runWithProgress(context,
          () => context.read<AuthProvider>().api.deleteResource(r.id),
          success: 'Deleted');
      _refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Resources / Suggestions')),
      body: FutureBuilder<({List<Resource> resources, List<Batch> batches})>(
        future: _future,
        builder: (context, snap) {
          final batches = snap.data?.batches ?? [];
          return Scaffold(
            floatingActionButton: FloatingActionButton.extended(
              onPressed: snap.hasData ? () => _edit(batches) : null,
              icon: const Icon(Icons.add),
              label: const Text('Share New'),
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
                final items = snap.data!.resources;
                if (items.isEmpty) {
                  return const EmptyState(
                      icon: Icons.menu_book_outlined,
                      message: 'Nothing shared yet. Tap "Share New".');
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final r = items[i];
                    return Card(
                      child: ListTile(
                        title: Text(r.title),
                        subtitle: Text(
                            '${r.kindLabel} • ${r.level} • ${r.isPublic ? 'Public' : 'Batch-only'}'),
                        trailing: PopupMenuButton<String>(
                          onSelected: (v) =>
                              v == 'edit' ? _edit(batches, r) : _delete(r),
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'edit', child: Text('Edit')),
                            PopupMenuItem(
                                value: 'delete', child: Text('Delete')),
                          ],
                        ),
                        onTap: () => _edit(batches, r),
                      ),
                    );
                  },
                );
              }),
            ),
          );
        },
      ),
    );
  }
}

class _ResourceForm extends StatefulWidget {
  final List<Batch> batches;
  final Resource? resource;
  const _ResourceForm({required this.batches, this.resource});
  @override
  State<_ResourceForm> createState() => _ResourceFormState();
}

class _ResourceFormState extends State<_ResourceForm> {
  final _form = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.resource?.title);
  late final _titleBn = TextEditingController(text: widget.resource?.titleBn);
  late final _body = TextEditingController(text: widget.resource?.body);
  late final _bodyBn = TextEditingController(text: widget.resource?.bodyBn);
  late final _fileUrl = TextEditingController(text: widget.resource?.fileUrl);
  late final _tags =
      TextEditingController(text: widget.resource?.tags.join(', '));
  late String _kind = widget.resource?.kind ?? 'suggestion';
  late String _level = widget.resource?.level ?? 'BOTH';
  late bool _isPublic = widget.resource?.isPublic ?? true;
  late String? _batchId = widget.resource?.batchId;

  bool get _isEdit => widget.resource != null;

  @override
  void dispose() {
    for (final c in [_title, _titleBn, _body, _bodyBn, _fileUrl, _tags]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final body = {
      'title': _title.text.trim(),
      'titleBn': _titleBn.text.trim(),
      'kind': _kind,
      'level': _level,
      'body': _body.text.trim(),
      'bodyBn': _bodyBn.text.trim(),
      if (_fileUrl.text.trim().isNotEmpty) 'fileUrl': _fileUrl.text.trim(),
      'isPublic': _isPublic,
      'batch': _batchId,
      'tags': _tags.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList(),
    };
    final api = context.read<AuthProvider>().api;
    final ok = await runWithProgress(
      context,
      () => _isEdit
          ? api.updateResource(widget.resource!.id, body).then((_) {})
          : api.createResource(body).then((_) {}),
      success: _isEdit ? 'Updated' : 'Shared with students',
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
            Text(_isEdit ? 'Edit Resource' : 'Share New Resource',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _kind,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: _kindOptions.entries
                      .map((e) => DropdownMenuItem(
                          value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => _kind = v!),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _level,
                  decoration: const InputDecoration(labelText: 'Level'),
                  items: const [
                    DropdownMenuItem(value: 'BOTH', child: Text('Both')),
                    DropdownMenuItem(value: 'SSC', child: Text('SSC')),
                    DropdownMenuItem(value: 'HSC', child: Text('HSC')),
                  ],
                  onChanged: (v) => setState(() => _level = v!),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title (English)'),
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
                controller: _body,
                maxLines: 3,
                decoration:
                    const InputDecoration(labelText: 'Content (English)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _bodyBn,
                maxLines: 3,
                decoration:
                    const InputDecoration(labelText: 'Content (Bangla)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _fileUrl,
                decoration: const InputDecoration(
                    labelText: 'File / PDF URL (optional)')),
            const SizedBox(height: 12),
            TextFormField(
                controller: _tags,
                decoration: const InputDecoration(
                    labelText: 'Tags (comma separated)')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              initialValue: _batchId,
              isExpanded: true,
              decoration: const InputDecoration(
                  labelText: 'Scope to batch (optional)'),
              items: [
                const DropdownMenuItem(value: null, child: Text('— None —')),
                ...widget.batches.map((b) =>
                    DropdownMenuItem(value: b.id, child: Text(b.name))),
              ],
              onChanged: (v) => setState(() => _batchId = v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isPublic,
              onChanged: (v) => setState(() => _isPublic = v),
              title: const Text('Public'),
              subtitle: const Text(
                  'On: visible to everyone. Off: only enrolled students.'),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: _save, child: const Text('Save')),
          ],
        ),
      ),
    );
  }
}
