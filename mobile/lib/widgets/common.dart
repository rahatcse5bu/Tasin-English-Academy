import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';

/// Centered loading spinner.
class Loading extends StatelessWidget {
  const Loading({super.key});
  @override
  Widget build(BuildContext context) =>
      const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()));
}

/// Empty / error state with optional retry.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final VoidCallback? onRetry;
  const EmptyState(
      {super.key, this.icon = Icons.inbox_outlined, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 56, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text(message,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 15)),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry')),
              ],
            ],
          ),
        ),
      );
}

/// Small coloured status pill.
class StatusPill extends StatelessWidget {
  final String status;
  final String? label;
  const StatusPill(this.status, {super.key, this.label});
  @override
  Widget build(BuildContext context) {
    final c = AppTheme.statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: c.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20)),
      child: Text((label ?? status).toUpperCase(),
          style: TextStyle(
              color: c, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

/// Section title with optional trailing action.
class SectionHeader extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const SectionHeader(this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
        child: Row(
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w700)),
            const Spacer(),
            ?trailing,
          ],
        ),
      );
}

/// Formatting helpers.
String fmtDate(DateTime? d) =>
    d == null ? '—' : DateFormat('d MMM yyyy').format(d);
String fmtDateTime(DateTime? d) =>
    d == null ? '—' : DateFormat('d MMM, h:mm a').format(d);
String fmtTime(DateTime? d) => d == null ? '—' : DateFormat('h:mm a').format(d);
String fmtMoney(num n) => '৳${n.toStringAsFixed(0)}';

/// Open an external URL (Google Meet, Google Form, file links).
Future<void> openUrl(BuildContext context, String? url) async {
  if (url == null || url.isEmpty) {
    _toast(context, 'No link available');
    return;
  }
  final uri = Uri.tryParse(url);
  if (uri == null || !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) _toast(context, 'Could not open link');
  }
}

void _toast(BuildContext context, String msg) => ScaffoldMessenger.of(context)
    .showSnackBar(SnackBar(content: Text(msg)));

void showToast(BuildContext context, String msg, {bool error = false}) =>
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? const Color(0xFFD64545) : null,
    ));

/// Run an async action with a blocking spinner; returns true on success.
Future<bool> runWithProgress(
    BuildContext context, Future<void> Function() action,
    {String? success}) async {
  showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()));
  try {
    await action();
    if (context.mounted) Navigator.of(context).pop();
    if (success != null && context.mounted) showToast(context, success);
    return true;
  } catch (e) {
    if (context.mounted) Navigator.of(context).pop();
    if (context.mounted) showToast(context, '$e', error: true);
    return false;
  }
}
