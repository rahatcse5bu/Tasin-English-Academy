import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'vocabulary_screen.dart';
import 'grammar_screen.dart';

/// Bottom sheet showing the full content of a resource (bilingual).
void showResourceDetail(BuildContext context, Resource r) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.7,
      maxChildSize: 0.95,
      builder: (_, controller) => ListView(
        controller: controller,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        children: [
          Row(
            children: [
              StatusPill(r.kind, label: r.kindLabel),
              const SizedBox(width: 8),
              if (r.level != 'BOTH') StatusPill('open', label: r.level),
            ],
          ),
          const SizedBox(height: 12),
          Text(r.title,
              style:
                  const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          if (r.titleBn?.isNotEmpty == true) ...[
            const SizedBox(height: 4),
            Text(r.titleBn!,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade700)),
          ],
          const SizedBox(height: 16),
          if (r.body?.isNotEmpty == true)
            Text(r.body!, style: const TextStyle(fontSize: 15, height: 1.5)),
          if (r.bodyBn?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Text(r.bodyBn!, style: const TextStyle(fontSize: 15, height: 1.6)),
          ],
          if (r.tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: r.tags
                  .map((t) => Chip(
                      label: Text('#$t'),
                      backgroundColor: const Color(0xFFEEF1FA)))
                  .toList(),
            ),
          ],
          if (r.fileUrl?.isNotEmpty == true) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => openUrl(context, r.fileUrl),
              icon: const Icon(Icons.download),
              label: const Text('Open / Download file'),
            ),
          ],
        ],
      ),
    ),
  );
}

const _kinds = <String, String>{
  '': 'All',
  'suggestion': 'Suggestions',
  'hack': 'Hacks',
  'tips': 'Tips',
  'best_practice': 'Best Practices',
  'lecture_sheet': 'Lecture Sheets',
  'note': 'Notes',
};

/// Student "Learn" tab — suggestions, hacks, tips, sheets filtered by kind.
/// The backend already scopes results to public + enrolled batches.
class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});
  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  String _kind = '';
  late Future<List<Resource>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Resource>> _load() => context
      .read<AuthProvider>()
      .api
      .resources(kind: _kind.isEmpty ? null : _kind);

  void _select(String k) => setState(() {
        _kind = k;
        _future = _load();
      });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Learn & Suggestions'),
        actions: [
          IconButton(
            tooltip: 'Vocabulary Builder',
            icon: const Icon(Icons.translate),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const VocabularyScreen())),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: Row(children: [
              Expanded(
                child: _learnBanner(
                  context,
                  icon: Icons.translate,
                  title: 'Vocabulary',
                  subtitle: '3,200 words • flashcards & quiz',
                  colors: const [AppTheme.seed, AppTheme.accent],
                  page: const VocabularyScreen(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _learnBanner(
                  context,
                  icon: Icons.spellcheck,
                  title: 'Grammar',
                  subtitle: 'Tenses, voice, narration & more',
                  colors: const [Color(0xFF0F9D8C), Color(0xFF3F4DB0)],
                  page: const GrammarScreen(),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: _kinds.entries
                  .map((e) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(e.value),
                          selected: _kind == e.key,
                          onSelected: (_) => _select(e.key),
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => _select(_kind),
              child: FutureBuilder<List<Resource>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Loading();
                  }
                  if (snap.hasError) {
                    return EmptyState(
                        icon: Icons.cloud_off,
                        message: '${snap.error}',
                        onRetry: () => _select(_kind));
                  }
                  final items = snap.data ?? [];
                  if (items.isEmpty) {
                    return const EmptyState(
                        icon: Icons.menu_book_outlined,
                        message: 'No materials in this category yet.');
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _ResourceCard(items[i]),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _learnBanner(BuildContext context,
      {required IconData icon,
      required String title,
      required String subtitle,
      required List<Color> colors,
      required Widget page}) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () =>
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => page)),
      child: Container(
        height: 116,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 26),
            const Spacer(),
            Text(title,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700)),
            Text(subtitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white70, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _ResourceCard extends StatelessWidget {
  final Resource r;
  const _ResourceCard(this.r);

  IconData get _icon => switch (r.kind) {
        'suggestion' => Icons.lightbulb_outline,
        'hack' => Icons.bolt,
        'tips' => Icons.tips_and_updates_outlined,
        'best_practice' => Icons.verified_outlined,
        'lecture_sheet' => Icons.description_outlined,
        _ => Icons.sticky_note_2_outlined,
      };

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => showResourceDetail(context, r),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFFEEF1FA),
                child: Icon(_icon, color: AppTheme.seed),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                        r.titleBn?.isNotEmpty == true ? r.titleBn! : r.title,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      r.bodyBn?.isNotEmpty == true
                          ? r.bodyBn!
                          : (r.body ?? ''),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      StatusPill(r.kind, label: r.kindLabel),
                      const Spacer(),
                      if (!r.isPublic)
                        const Icon(Icons.lock_outline,
                            size: 14, color: Colors.grey),
                    ]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
