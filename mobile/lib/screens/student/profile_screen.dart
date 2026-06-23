import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import '../../widgets/common.dart';
import 'payments_screen.dart';
import 'attendance_screen.dart';
import 'batches_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 42,
                  backgroundColor: AppTheme.seed,
                  child: Text(
                    (user?.name.isNotEmpty == true
                        ? user!.name[0].toUpperCase()
                        : '?'),
                    style: const TextStyle(
                        fontSize: 32,
                        color: Colors.white,
                        fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user?.name ?? '',
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w800)),
                Text(user?.email ?? '',
                    style: TextStyle(color: Colors.grey.shade600)),
                const SizedBox(height: 6),
                StatusPill('open',
                    label: '${user?.level ?? '—'} • Student'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                _tile(Icons.phone_outlined, 'Phone', user?.phone ?? '—'),
                const Divider(height: 1),
                _tile(Icons.account_balance_outlined, 'Institution',
                    user?.institution ?? '—'),
                const Divider(height: 1),
                _tile(Icons.home_outlined, 'Address', user?.address ?? '—'),
                const Divider(height: 1),
                _tile(Icons.groups_outlined, 'Enrolled batches',
                    '${user?.enrolledBatches.length ?? 0}'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                _nav(context, Icons.edit_outlined, 'Edit profile',
                    () => _editProfile(context)),
                const Divider(height: 1),
                _nav(context, Icons.groups_outlined, 'Browse batches',
                    () => _push(context, const BatchesScreen())),
                const Divider(height: 1),
                _nav(context, Icons.payments_outlined, 'My payments',
                    () => _push(context, const PaymentsScreen())),
                const Divider(height: 1),
                _nav(context, Icons.fact_check_outlined, 'My attendance',
                    () => _push(context, const AttendanceScreen())),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.tonalIcon(
            style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFDE8E8),
                foregroundColor: const Color(0xFFD64545)),
            onPressed: () => _confirmLogout(context),
            icon: const Icon(Icons.logout),
            label: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String label, String value) => ListTile(
        leading: Icon(icon, color: AppTheme.seed),
        title: Text(label, style: const TextStyle(fontSize: 13)),
        subtitle: Text(value,
            style: const TextStyle(
                fontSize: 15, color: Colors.black, fontWeight: FontWeight.w500)),
      );

  Widget _nav(BuildContext context, IconData icon, String label,
          VoidCallback onTap) =>
      ListTile(
        leading: Icon(icon, color: AppTheme.seed),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      );

  void _push(BuildContext context, Widget page) => Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => page));

  void _confirmLogout(BuildContext context) => showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Log out?'),
          content: const Text('You will need to sign in again.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel')),
            FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  context.read<AuthProvider>().logout();
                },
                child: const Text('Log Out')),
          ],
        ),
      );

  void _editProfile(BuildContext context) {
    final auth = context.read<AuthProvider>();
    final user = auth.user!;
    final name = TextEditingController(text: user.name);
    final phone = TextEditingController(text: user.phone ?? '');
    final institution = TextEditingController(text: user.institution ?? '');
    final address = TextEditingController(text: user.address ?? '');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 0, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Edit Profile',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 12),
            TextField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 12),
            TextField(
                controller: institution,
                decoration: const InputDecoration(labelText: 'Institution')),
            const SizedBox(height: 12),
            TextField(
                controller: address,
                decoration: const InputDecoration(labelText: 'Address')),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () async {
                final ok = await runWithProgress(
                  ctx,
                  () => auth.updateProfile({
                    'name': name.text.trim(),
                    'phone': phone.text.trim(),
                    'institution': institution.text.trim(),
                    'address': address.text.trim(),
                  }),
                  success: 'Profile updated',
                );
                if (ok && ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
