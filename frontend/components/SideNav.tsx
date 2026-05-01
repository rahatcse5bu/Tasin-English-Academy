'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const path = usePathname();
  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <nav className="lg:hidden -mx-4 px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max border-b border-slate-200 pb-2">
          {items.map((it) => {
            const active = path === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm flex-shrink-0 ${
                  active ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block">
        <nav className="card p-2 sticky top-20">
          {items.map((it) => {
            const active = path === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
