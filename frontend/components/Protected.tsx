'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Protected({
  role,
  children,
}: {
  role?: 'admin' | 'student';
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (role && user.role !== role) router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, loading, role, router]);

  if (loading || !user || (role && user.role !== role)) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-slate-500">লোড হচ্ছে…</div>;
  }
  return <>{children}</>;
}
