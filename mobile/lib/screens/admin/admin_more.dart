import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_provider.dart';
import '../../theme.dart';
import 'manage_classes.dart';
import 'manage_exams.dart';
import 'manage_payments.dart';
import 'manage_teachers.dart';
import 'mark_attendance.dart';

/// Admin "More" tab — entry points to the remaining management areas
/// plus account info and logout.
class AdminMore extends StatelessWidget {
  const AdminMore({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: AppTheme.seed,
                child: Icon(Icons.admin_panel_settings, color: Colors.white),
              ),
              title: Text(user?.name ?? 'Admin'),
              subtitle: Text(user?.email ?? ''),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Column(children: [
              _nav(context, Icons.event_outlined, 'Classes',
                  'Schedule & manage sessions', const ManageClasses()),
              const Divider(height: 1),
              _nav(context, Icons.assignment_outlined, 'Exams & Results',
                  'Create exams, enter marks', const ManageExams()),
              const Divider(height: 1),
              _nav(context, Icons.fact_check_outlined, 'Attendance',
                  'Mark class attendance', const MarkAttendanceScreen()),
              const Divider(height: 1),
              _nav(context, Icons.payments_outlined, 'Payments',
                  'Approve / reject fees', const ManagePayments()),
              const Divider(height: 1),
              _nav(context, Icons.school_outlined, 'Teachers',
                  'Manage teacher profiles', const ManageTeachers()),
            ]),
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

  Widget _nav(BuildContext context, IconData icon, String title,
          String subtitle, Widget page) =>
      ListTile(
        leading: Icon(icon, color: AppTheme.seed),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => page)),
      );

  void _confirmLogout(BuildContext context) => showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Log out?'),
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
}
