'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Protected from '@/components/Protected';
import SlideDeck from '@/components/decks/SlideDeck';
import type { Deck, Neighbours } from '@/lib/deck/types';

function DeckView() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [nav, setNav] = useState<Neighbours | undefined>();
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    api<Deck>(`/decks/${id}`, { token })
      .then((d) => alive && setDeck(d))
      .catch(() => alive && setErr(true));
    api<Neighbours>(`/decks/${id}/neighbours`, { token })
      .then((n) => alive && setNav(n))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, token]);

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">অধ্যায়টি পাওয়া যায়নি।</p>
        <Link href="/decks" className="btn-secondary mt-4">
          ← সব অধ্যায়
        </Link>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse mx-auto" />
        <p className="mt-4 text-sm text-slate-400">ক্লাস প্রস্তুত হচ্ছে…</p>
      </div>
    );
  }

  return <SlideDeck deck={deck} nav={nav} />;
}

export default function DeckPage() {
  return (
    <Protected roles={['teacher', 'admin']}>
      <DeckView />
    </Protected>
  );
}
