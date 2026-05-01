'use client';
import Protected from '@/components/Protected';
import SideNav from '@/components/SideNav';

const items = [
  { href: '/admin', label: 'ওভারভিউ' },
  { href: '/admin/teachers', label: 'শিক্ষক' },
  { href: '/admin/batches', label: 'ব্যাচ' },
  { href: '/admin/classes', label: 'ক্লাস' },
  { href: '/admin/students', label: 'শিক্ষার্থী' },
  { href: '/admin/payments', label: 'পেমেন্ট' },
  { href: '/admin/attendance', label: 'উপস্থিতি' },
  { href: '/admin/exams', label: 'পরীক্ষা' },
  { href: '/admin/resources', label: 'রিসোর্স' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected role="admin">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <SideNav items={items} />
        <section className="min-w-0">{children}</section>
      </div>
    </Protected>
  );
}
