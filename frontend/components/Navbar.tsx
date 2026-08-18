'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  // mentors always; students once something has been shared with them
  const staff = !!user;
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white grid place-items-center font-bold flex-shrink-0">তা</div>
          <div className="min-w-0">
            <div className="font-bold text-brand-900 leading-tight text-sm sm:text-base truncate">তাসিন ইংলিশ একাডেমি</div>
            <div className="text-[10px] sm:text-xs text-slate-500 leading-tight truncate">Tasin English Academy</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-slate-700 hover:text-brand-700">হোম</Link>
          <Link href="/teachers" className="text-slate-700 hover:text-brand-700">শিক্ষকবৃন্দ</Link>
          <Link href="/batches" className="text-slate-700 hover:text-brand-700">ব্যাচসমূহ</Link>
          {staff && (
            <Link href="/decks" className="text-slate-700 hover:text-brand-700">স্লাইড ক্লাস</Link>
          )}
          <Link href="/resources" className="text-slate-700 hover:text-brand-700">রিসোর্স</Link>
          <Link href="/top-performers" className="text-slate-700 hover:text-brand-700">সেরা পারফর্মার</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Link href="/admin" className="btn-secondary">অ্যাডমিন প্যানেল</Link>
              ) : (
                <Link href="/dashboard" className="btn-secondary">ড্যাশবোর্ড</Link>
              )}
              <button onClick={logout} className="btn-primary">লগআউট</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">লগইন</Link>
              <Link href="/register" className="btn-primary">রেজিস্ট্রেশন</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-slate-700" onClick={() => setOpen(!open)} aria-label="menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)}>হোম</Link>
            <Link href="/teachers" onClick={() => setOpen(false)}>শিক্ষকবৃন্দ</Link>
            <Link href="/batches" onClick={() => setOpen(false)}>ব্যাচসমূহ</Link>
            {staff && <Link href="/decks" onClick={() => setOpen(false)}>স্লাইড ক্লাস</Link>}
            <Link href="/resources" onClick={() => setOpen(false)}>রিসোর্স</Link>
            <Link href="/top-performers" onClick={() => setOpen(false)}>সেরা পারফর্মার</Link>
            {user ? (
              <>
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>
                  {user.role === 'admin' ? 'অ্যাডমিন প্যানেল' : 'ড্যাশবোর্ড'}
                </Link>
                <button onClick={() => { logout(); setOpen(false); }} className="text-left">লগআউট</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>লগইন</Link>
                <Link href="/register" onClick={() => setOpen(false)}>রেজিস্ট্রেশন</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
