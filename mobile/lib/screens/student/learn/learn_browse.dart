import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/auth_provider.dart';
import '../../../theme.dart';
import '../../../widgets/common.dart';
import 'lesson_studio.dart';

/// Entry point of the academic content: pick a class.
class ClassListScreen extends StatefulWidget {
  const ClassListScreen({super.key});
  @override
  State<ClassListScreen> createState() => _ClassListScreenState();
}

class _ClassListScreenState extends State<ClassListScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AuthProvider>().api.learnClasses();
  }

  void _reload() =>
      setState(() => _future = context.read<AuthProvider>().api.learnClasses());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Class Lessons')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError) {
            return EmptyState(
                icon: Icons.cloud_off, message: '${snap.error}', onRetry: _reload);
          }
          final classes = snap.data ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              for (final c in classes) _ClassCard(c),
              const SizedBox(height: 8),
              const _ComingSoon(['ষষ্ঠ শ্রেণি', 'সপ্তম শ্রেণি', 'নবম-দশম শ্রেণি']),
            ],
          );
        },
      ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  final Map<String, dynamic> c;
  const _ClassCard(this.c);

  @override
  Widget build(BuildContext context) {
    final subjects = (c['subjects'] as List?) ?? [];
    final nameBn = (c['nameBn'] ?? c['name'] ?? '').toString();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => SubjectListScreen(
                classId: c['id'].toString(), classNameBn: nameBn),
          )),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppTheme.seed,
                  child: Text(nameBn.isNotEmpty ? nameBn.characters.first : '?',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 20)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(nameBn,
                          style: const TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w800)),
                      Text(c['name']?.toString() ?? '',
                          style: TextStyle(color: Colors.grey.shade600)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          for (final s in subjects)
                            Chip(
                              visualDensity: VisualDensity.compact,
                              backgroundColor: const Color(0xFFEEF1FA),
                              label: Text(
                                  '${s['nameBn'] ?? s['name']} • ${s['unitCount']} ইউনিট',
                                  style: const TextStyle(fontSize: 12)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Subjects within a class.
class SubjectListScreen extends StatefulWidget {
  final String classId;
  final String classNameBn;
  const SubjectListScreen(
      {super.key, required this.classId, required this.classNameBn});
  @override
  State<SubjectListScreen> createState() => _SubjectListScreenState();
}

class _SubjectListScreenState extends State<SubjectListScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AuthProvider>().api.learnClass(widget.classId);
  }

  void _reload() => setState(() =>
      _future = context.read<AuthProvider>().api.learnClass(widget.classId));

  static const _emoji = {
    'english': '📚',
    'math': '🔢',
    'science': '🔬',
    'ict': '💻',
    'bangla': '🇧🇩',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.classNameBn)),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError) {
            return EmptyState(
                icon: Icons.cloud_off, message: '${snap.error}', onRetry: _reload);
          }
          final subjects = (snap.data?['subjects'] as List?) ?? [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(4, 0, 4, 12),
                child: Text('বিষয় নির্বাচন করো',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
              for (final s in subjects)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => UnitListScreen(
                          classId: widget.classId,
                          subjectId: s['id'].toString(),
                          subjectNameBn: (s['nameBn'] ?? s['name']).toString(),
                        ),
                      )),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Text(_emoji[s['id']] ?? '📖',
                                style: const TextStyle(fontSize: 30)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text((s['nameBn'] ?? s['name']).toString(),
                                      style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w800)),
                                  Text(s['book']?.toString() ?? '',
                                      style: TextStyle(
                                          color: Colors.grey.shade600)),
                                  const SizedBox(height: 6),
                                  Text(
                                      '${s['unitCount']} ইউনিট • ${s['lessonCount']} পাঠ',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade500)),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// Units within a subject.
class UnitListScreen extends StatefulWidget {
  final String classId;
  final String subjectId;
  final String subjectNameBn;
  const UnitListScreen(
      {super.key,
      required this.classId,
      required this.subjectId,
      required this.subjectNameBn});
  @override
  State<UnitListScreen> createState() => _UnitListScreenState();
}

class _UnitListScreenState extends State<UnitListScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = context
        .read<AuthProvider>()
        .api
        .learnSubject(widget.classId, widget.subjectId);
  }

  void _reload() => setState(() => _future = context
      .read<AuthProvider>()
      .api
      .learnSubject(widget.classId, widget.subjectId));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.subjectNameBn)),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Loading();
          }
          if (snap.hasError) {
            return EmptyState(
                icon: Icons.cloud_off, message: '${snap.error}', onRetry: _reload);
          }
          final units = (snap.data?['units'] as List?) ?? [];
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: units.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final u = Map<String, dynamic>.from(units[i]);
              return Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => UnitLessonScreen(
                      classId: widget.classId,
                      subjectId: widget.subjectId,
                      unitId: u['id'].toString(),
                    ),
                  )),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: AppTheme.seed,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text('${u['number']}',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 18)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('UNIT ${u['number']}',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.grey.shade500,
                                      letterSpacing: 1)),
                              Text(u['title']?.toString() ?? '',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800)),
                              if ((u['banglaTitle'] ?? '').toString().isNotEmpty)
                                Text(u['banglaTitle'].toString(),
                                    style: TextStyle(
                                        color: Colors.grey.shade600)),
                              const SizedBox(height: 8),
                              Wrap(spacing: 6, runSpacing: 6, children: [
                                _pill('${u['lessonCount']} পাঠ',
                                    const Color(0xFFEEF1FA), AppTheme.seed),
                                if ((u['poemCount'] ?? 0) > 0)
                                  _pill('${u['poemCount']} কবিতা',
                                      const Color(0xFFFCE7EC),
                                      const Color(0xFFD64545)),
                                if ((u['minutes'] ?? 0) > 0)
                                  _pill('~${u['minutes']} মিনিট',
                                      const Color(0xFFFFF2D9),
                                      const Color(0xFFB7791F)),
                              ]),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right),
                      ],
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

  Widget _pill(String t, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration:
            BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Text(t,
            style: TextStyle(
                color: fg, fontSize: 11.5, fontWeight: FontWeight.w700)),
      );
}

class _ComingSoon extends StatelessWidget {
  final List<String> names;
  const _ComingSoon(this.names);
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final n in names)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Opacity(
              opacity: 0.55,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const CircleAvatar(
                          radius: 26,
                          backgroundColor: Color(0xFFE2E5EF),
                          child: Icon(Icons.lock_clock, color: Colors.grey)),
                      const SizedBox(width: 16),
                      Expanded(
                          child: Text(n,
                              style: const TextStyle(
                                  fontSize: 17, fontWeight: FontWeight.w700))),
                      const Text('শীঘ্রই', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
