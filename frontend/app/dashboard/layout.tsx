'use client';
import Protected from '@/components/Protected';
import SideNav from '@/components/SideNav';

const items = [
  { href: '/dashboard', label: 'ওভারভিউ' },
  { href: '/dashboard/batches', label: 'আমার ব্যাচ' },
  { href: '/dashboard/payments', label: 'পেমেন্ট' },
  { href: '/dashboard/attendance', label: 'উপস্থিতি' },
  { href: '/dashboard/exams', label: 'পরীক্ষা ও ফলাফল' },
  { href: '/dashboard/profile', label: 'প্রোফাইল' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected role="student">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <SideNav items={items} />
        <section className="min-w-0">{children}</section>
      </div>
    </Protected>
  );
}
