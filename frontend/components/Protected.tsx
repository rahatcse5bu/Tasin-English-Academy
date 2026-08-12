'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/lib/auth';

const home = (role: UserRole) => (role === 'admin' ? '/admin' : role === 'teacher' ? '/decks' : '/dashboard');

export default function Protected({
  role,
  roles,
  children,
}: {
  /** single allowed role — kept for the pages that already use it */
  role?: UserRole;
  /** any one of these roles may enter, e.g. roles={['teacher', 'admin']} */
  roles?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = roles ?? (role ? [role] : null);
  const ok = !!user && (!allowed || allowed.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!ok) router.replace(home(user.role));
  }, [user, loading, ok, router]);

  if (loading || !ok) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-slate-500">লোড হচ্ছে…</div>;
  }
  return <>{children}</>;
}
