'use client';

/**
 * SlideDeck — the projector view for one HSC chapter.
 *
 * Slides are built as HTML strings (lib/deck/build.ts) and all of them stay in the
 * DOM, with only the active one shown. That keeps three things simple and fast:
 * per-slide whiteboard drawings, per-slide reveal state, and printing the whole deck.
 *
 * Teaching behaviour that matters:
 *   R / the Answer button opens exactly ONE answer at a time, in reading order.
 *   A opens everything (also used before printing a handout).
 *   B hides the Bangla so students translate first.
 *   W is a whiteboard: pen, highlighter, laser pointer, eraser.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { build } from '@/lib/deck/build';
import { plain } from '@/lib/deck/text';
import { buildLexicon, linkWords, norm, type WordEntry } from '@/lib/deck/lexicon';
import WordModal from './WordModal';
import type { Deck, Neighbours } from '@/lib/deck/types';

const BRAND = { name: 'Tasin English Academy', phone: '01722335722' };
const WB_COLORS = ['#d9242b', '#24528f', '#111827', '#0f9d58', '#d98324', '#7c3aed'];
const WB_SIZES = [2, 3, 4, 6, 9, 14, 22];

type Tool = 'pen' | 'marker' | 'laser' | 'eraser';

export default function SlideDeck({ deck, nav }: { deck: Deck; nav?: Neighbours }) {
  const slides = useMemo(() => build(deck), [deck]);
  const params = useSearchParams();

  const stageRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const laserRef = useRef<HTMLCanvasElement>(null);

  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const [dark, setDark] = useState(false);
  const [hideBn, setHideBn] = useState(false);
  const [overview, setOverview] = useState(false);
  const [help, setHelp] = useState(false);
  const [wbOn, setWbOn] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(WB_COLORS[0]);
  const [size, setSize] = useState(3);
  const [ans, setAns] = useState({ left: 0, total: 0 });
  const [word, setWord] = useState<WordEntry | null>(null);
  const [hint, setHint] = useState<{ x: number; y: number; bn: string; above: boolean } | null>(null);

  /** Vocabulary of this chapter, joined and indexed for in-passage lookup. */
  const lex = useMemo(() => buildLexicon(deck), [deck]);

  /* ---------------- slide helpers ---------------- */

  const slideEl = useCallback(
    (n = i) => stageRef.current?.querySelectorAll<HTMLElement>('.slide')[n] ?? null,
    [i],
  );

  /** Answers on this slide that have not been opened yet, in reading order. */
  const pending = useCallback(() => {
    const cur = slideEl();
    if (!cur) return [] as HTMLElement[];
    return Array.from(
      cur.querySelectorAll<HTMLElement>(
        '[data-rev]:not(.revealed), [data-mcq]:not(.revealed), [data-qa].collapsed',
      ),
    );
  }, [slideEl]);

  const countAnswers = useCallback(() => {
    const cur = slideEl();
    if (!cur) return setAns({ left: 0, total: 0 });
    const total = cur.querySelectorAll('[data-rev], [data-mcq], [data-qa]').length;
    setAns({ left: pending().length, total });
  }, [slideEl, pending]);

  /**
   * Short slides look better optically centred, but a centred flex column clips its
   * top once it overflows — so this must re-run after anything that changes height:
   * revealing an answer, toggling Bangla, resizing, going fullscreen.
   */
  const refit = useCallback(() => {
    const body = slideEl()?.querySelector<HTMLElement>('.slide-body');
    if (!body) return;
    body.classList.remove('centered');
    if (body.scrollHeight <= body.clientHeight + 1) body.classList.add('centered');
  }, [slideEl]);

  const revealNode = useCallback(
    (node: HTMLElement) => {
      if (node.hasAttribute('data-qa')) node.classList.remove('collapsed');
      else node.classList.add('revealed');
      refit();
      countAnswers();
    },
    [refit, countAnswers],
  );

  /** One press → one answer. */
  const revealNext = useCallback(() => {
    const p = pending();
    if (!p.length) return;
    revealNode(p[0]);
    p[0].scrollIntoView({ block: 'nearest' });
  }, [pending, revealNode]);

  const revealAll = useCallback(() => {
    stageRef.current
      ?.querySelectorAll('[data-mcq], [data-rev]')
      .forEach((m) => m.classList.add('revealed'));
    stageRef.current
      ?.querySelectorAll('[data-qa]')
      .forEach((m) => m.classList.remove('collapsed'));
    refit();
    countAnswers();
  }, [refit, countAnswers]);

  /**
   * Make the vocabulary in the passage tappable. Runs once per deck, after the
   * slides are in the DOM — the linker rewrites text nodes, so it must not see
   * markup React still owns.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage
      .querySelectorAll<HTMLElement>('.slide[data-kind="passage"] .passage, .slide[data-kind="summary"] .sum-en')
      .forEach((el) => linkWords(el, lex));
  }, [lex]);

  const openWord = useCallback(
    (key: string) => {
      const e = lex.lookup.get(norm(key));
      if (e) {
        setHint(null);
        setWord(e);
      }
    },
    [lex],
  );

  useEffect(() => setHint(null), [i]);

  /* ---------------- navigation ---------------- */

  const go = useCallback(
    (n: number) => {
      const max = slides.length - 1;
      const t = Math.max(0, Math.min(max, n));
      setBack(t < i);
      setI(t);
    },
    [i, slides.length],
  );

  // ?s=<n> deep-links to a slide; otherwise resume where the mentor left off
  useEffect(() => {
    const asked = parseInt(params.get('s') || '', 10);
    if (asked >= 1 && asked <= slides.length) {
      setI(asked - 1);
    } else {
      try {
        const saved = parseInt(localStorage.getItem('tea:pos:' + deck.id) || '0', 10);
        if (saved > 0 && saved < slides.length) setI(saved);
      } catch {}
    }
    try {
      setDark(localStorage.getItem('tea:theme') === 'dark');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id, slides.length]);

  useEffect(() => {
    try {
      localStorage.setItem('tea:pos:' + deck.id, String(i));
      const u = new URL(window.location.href);
      u.searchParams.set('s', String(i + 1));
      window.history.replaceState(null, '', u.toString());
    } catch {}
    const body = slideEl()?.querySelector<HTMLElement>('.slide-body');
    if (body) body.scrollTop = 0;
    wbRestore(i);
    refit();
    countAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, slides]);

  useEffect(() => {
    refit();
  }, [hideBn, refit]);

  /* ---------------- whiteboard ---------------- */

  const wb = useRef({
    drawing: false,
    last: { x: 0, y: 0 },
    snaps: {} as Record<number, HTMLCanvasElement>,
    laserT: 0 as any,
    dpr: 1,
  });

  const wbResize = useCallback(() => {
    const stage = stageRef.current;
    const ink = inkRef.current;
    const laser = laserRef.current;
    if (!stage || !ink || !laser) return;
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    wb.current.dpr = dpr;
    [ink, laser].forEach((c) => {
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
      c.style.width = r.width + 'px';
      c.style.height = r.height + 'px';
      c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }, []);

  function wbSave(n: number) {
    const ink = inkRef.current;
    if (!ink || !ink.width) return;
    const oc = document.createElement('canvas');
    oc.width = ink.width;
    oc.height = ink.height;
    oc.getContext('2d')!.drawImage(ink, 0, 0);
    wb.current.snaps[n] = oc;
  }

  function wbRestore(n: number) {
    const ink = inkRef.current;
    const laser = laserRef.current;
    if (!ink || !laser) return;
    const d = wb.current.dpr || 1;
    const c = ink.getContext('2d')!;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, ink.width, ink.height);
    laser.getContext('2d')!.clearRect(0, 0, laser.width, laser.height);
    const snap = wb.current.snaps[n];
    if (snap) c.drawImage(snap, 0, 0);
    c.setTransform(d, 0, 0, d, 0, 0);
  }

  const wbPos = (e: React.PointerEvent) => {
    const r = inkRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function stroke(x0: number, y0: number, x1: number, y1: number) {
    const c = inkRef.current!.getContext('2d')!;
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = tool === 'marker' ? 0.4 : 1;
    c.strokeStyle = color;
    c.lineWidth = tool === 'marker' ? size * 6 : size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }
  function erase(x: number, y: number) {
    const c = inkRef.current!.getContext('2d')!;
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.arc(x, y, size * 5, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  function laserLine(x0: number, y0: number, x1: number, y1: number) {
    const c = laserRef.current!.getContext('2d')!;
    c.globalAlpha = 0.75;
    c.strokeStyle = '#e11d2e';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    c.globalAlpha = 1;
  }

  const onDown = (e: React.PointerEvent) => {
    if (!wbOn) return;
    e.preventDefault();
    try {
      inkRef.current!.setPointerCapture(e.pointerId);
    } catch {}
    wb.current.drawing = true;
    const p = wbPos(e);
    wb.current.last = p;
    if (tool === 'laser') laserLine(p.x, p.y, p.x, p.y);
    else if (tool === 'eraser') erase(p.x, p.y);
    else stroke(p.x, p.y, p.x + 0.01, p.y + 0.01);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!wbOn || !wb.current.drawing) return;
    e.preventDefault();
    const p = wbPos(e);
    const l = wb.current.last;
    if (tool === 'laser') laserLine(l.x, l.y, p.x, p.y);
    else if (tool === 'eraser') erase(p.x, p.y);
    else stroke(l.x, l.y, p.x, p.y);
    wb.current.last = p;
  };
  const onUp = () => {
    if (!wb.current.drawing) return;
    wb.current.drawing = false;
    wbSave(i);
    if (tool === 'laser') {
      clearTimeout(wb.current.laserT);
      wb.current.laserT = setTimeout(() => {
        const l = laserRef.current;
        if (l) l.getContext('2d')!.clearRect(0, 0, l.width, l.height);
      }, 900);
    }
  };
  const wbClear = () => {
    const ink = inkRef.current!;
    const laser = laserRef.current!;
    ink.getContext('2d')!.clearRect(0, 0, ink.width, ink.height);
    laser.getContext('2d')!.clearRect(0, 0, laser.width, laser.height);
    delete wb.current.snaps[i];
  };

  useEffect(() => {
    wbResize();
    const onR = () => {
      wbResize();
      wbRestore(i);
      refit();
    };
    window.addEventListener('resize', onR);
    document.addEventListener('fullscreenchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      document.removeEventListener('fullscreenchange', onR);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wbResize]);

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      const k = e.key;
      // a focused vocabulary word opens its card instead of advancing
      if ((k === 'Enter' || k === ' ') && t?.classList?.contains('wq')) {
        e.preventDefault();
        openWord(t.dataset.word || t.textContent || '');
        return;
      }
      if (word) return; // the word card owns the keyboard while it is open
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(i + 1); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(i - 1); }
      else if (k === 'Home') { e.preventDefault(); go(0); }
      else if (k === 'End') { e.preventDefault(); go(slides.length - 1); }
      else if (k === 'Escape') { setOverview(false); setHelp(false); setWbOn(false); }
      else if (k === 'r' || k === 'R') { e.preventDefault(); revealNext(); }
      else if (k === 'a' || k === 'A') revealAll();
      else if (k === 'o' || k === 'O') setOverview((v) => !v);
      else if (k === 'b' || k === 'B') setHideBn((v) => !v);
      else if (k === 'w' || k === 'W') setWbOn((v) => !v);
      else if (k === 'd' || k === 'D') setDark((v) => !v);
      else if (k === 'f' || k === 'F') toggleFull();
      else if (k === '?' || k === '/') setHelp((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, slides.length, go, revealNext, revealAll, openWord, word]);

  useEffect(() => {
    try { localStorage.setItem('tea:theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  /* clicking a single answer opens just that one */
  /** Hover a vocabulary word → its Bangla meaning, anchored to the word. */
  const onStageOver = (e: React.MouseEvent) => {
    const w = (e.target as HTMLElement).closest<HTMLElement>('.wq');
    if (!w || !w.dataset.bn) {
      if (hint) setHint(null);
      return;
    }
    const r = w.getBoundingClientRect();
    const above = r.top > 110; // not enough room up top → drop it below the word
    setHint({
      x: Math.min(Math.max(r.left + r.width / 2, 190), window.innerWidth - 190),
      y: above ? r.top - 10 : r.bottom + 10,
      bn: w.dataset.bn,
      above,
    });
  };

  const onStageClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const w = t.closest<HTMLElement>('.wq');
    if (w) {
      e.stopPropagation();
      openWord(w.dataset.word || w.textContent || '');
      return;
    }
    const opt = t.closest<HTMLElement>('[data-opt]');
    if (opt) {
      const box = opt.closest<HTMLElement>('[data-mcq]')!;
      box.classList.add('revealed');
      if (!opt.classList.contains('correct')) opt.classList.add('wrongpick');
      refit();
      countAnswers();
      return;
    }
    const qa = t.closest<HTMLElement>('[data-qa] .q');
    if (qa) {
      qa.closest('[data-qa]')!.classList.toggle('collapsed');
      refit();
      countAnswers();
      return;
    }
    const row = t.closest<HTMLElement>('[data-rev]');
    if (row) {
      row.classList.toggle('revealed');
      refit();
      countAnswers();
    }
  };

  /* touch swipe */
  const touch = useRef({ x: 0, y: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (wbOn) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? i + 1 : i - 1);
  };

  const foot = (n: number) => (
    <footer className="slide-foot">
      <b>{BRAND.name}</b>
      <span className="dot">•</span>
      <span>{BRAND.phone}</span>
      <span className="dot">•</span>
      <span className="bn">{plain(deck.paperName) || 'HSC English 1st Paper'}</span>
      <span className="pg">
        {n + 1} / {slides.length}
      </span>
    </footer>
  );

  const answerLabel = ans.total
    ? ans.left
      ? `Answer ${ans.total - ans.left + 1}/${ans.total}`
      : 'সব দেখানো হয়েছে'
    : '';

  return (
    <div
      className={`tea-deck${hideBn ? ' hide-bn' : ''}${wbOn ? ' wb-on' : ''}`}
      data-deck-theme={dark ? 'dark' : 'light'}
    >
      <div id="deck">
        <header className="topbar no-print">
          <Link className="logo" href="/decks" title="সব চ্যাপ্টার">
            <span className="logo-mark">TEA</span>
            <span>Tasin English Academy</span>
          </Link>
          <div className="crumb">
            {plain(deck.unit)}
            {deck.lesson != null && <> &nbsp;·&nbsp; Lesson {deck.lesson}</>}
            &nbsp;›&nbsp; {plain(deck.unitName)} &nbsp;›&nbsp; <b>{plain(deck.title)}</b>
          </div>
          <div className="spacer" />
          {ans.total > 0 && (
            <button
              className={`tbtn${ans.left === 0 ? ' on' : ''}`}
              disabled={ans.left === 0}
              onClick={revealNext}
              title="Show the next answer, one at a time (R)"
            >
              <span className="ico">👁️</span>
              <span>{answerLabel}</span>
            </button>
          )}
          <button
            className={`tbtn${hideBn ? '' : ' on'}`}
            onClick={() => setHideBn((v) => !v)}
            title="Toggle Bangla (B)"
          >
            <span className="ico">🇧🇩</span>
            <span>বাংলা: {hideBn ? 'OFF' : 'ON'}</span>
          </button>
          <button className="tbtn" onClick={() => setOverview(true)} title="All slides (O)">
            <span className="ico">▦</span>
            <span>Slides</span>
          </button>
          <button
            className="tbtn"
            onClick={() => {
              revealAll();
              setTimeout(() => window.print(), 150);
            }}
            title="Print / Save as PDF"
          >
            <span className="ico">🖨️</span>
            <span>PDF</span>
          </button>
          <button
            className={`tbtn${wbOn ? ' on' : ''}`}
            onClick={() => setWbOn((v) => !v)}
            title="Whiteboard (W)"
          >
            <span className="ico">🖌️</span>
            <span>Draw</span>
          </button>
          <button className="tbtn" onClick={() => setDark((v) => !v)} title="Dark mode (D)">
            <span className="ico">{dark ? '☀️' : '🌙'}</span>
          </button>
          <button className="tbtn" onClick={toggleFull} title="Fullscreen (F)">
            <span className="ico">⛶</span>
          </button>
          <button className="tbtn" onClick={() => setHelp(true)} title="Shortcuts (?)">
            <span className="ico">?</span>
          </button>
        </header>

        <div className="progress no-print">
          <i style={{ width: `${(i / Math.max(1, slides.length - 1)) * 100}%` }} />
        </div>

        <main
          id="stage"
          ref={stageRef}
          onClick={onStageClick}
          onMouseOver={onStageOver}
          onMouseOut={() => setHint(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {slides.map((s, n) => (
            <section
              key={n}
              className={`slide${n === i ? ' active' : ''}${back && n === i ? ' back' : ''}`}
              data-i={n}
              data-kind={s.kind}
            >
              {s.bare ? (
                <>
                  <div className="slide-body" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: s.html }} />
                  </div>
                  {foot(n)}
                </>
              ) : (
                <>
                  <div className="slide-head">
                    <div className="eyebrow">
                      {plain(deck.unit)} · {plain(deck.title)}
                    </div>
                    <h2
                      className={`slide-title${s.bnTitle ? ' bn' : ''}`}
                      dangerouslySetInnerHTML={{ __html: s.title }}
                    />
                  </div>
                  <div className="slide-body" dangerouslySetInnerHTML={{ __html: s.html }} />
                  {foot(n)}
                </>
              )}
            </section>
          ))}

          <canvas
            ref={inkRef}
            className="wb-canvas"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
          <canvas ref={laserRef} className="wb-canvas wb-laser" />
        </main>

        <button
          className="navarrow prev no-print"
          onClick={() => go(i - 1)}
          disabled={i === 0}
          title="Previous (←)"
        >
          ‹
        </button>
        <button
          className="navarrow next no-print"
          onClick={() => go(i + 1)}
          disabled={i === slides.length - 1}
          title="Next (→)"
        >
          ›
        </button>
      </div>

      {/* whiteboard palette */}
      <div id="wb-palette">
        {(['pen', 'marker', 'laser', 'eraser'] as Tool[]).map((t) => (
          <button
            key={t}
            className={`wb-btn${tool === t ? ' on' : ''}`}
            onClick={() => setTool(t)}
            title={t}
          >
            {t === 'pen' ? '✏️' : t === 'marker' ? '🖍️' : t === 'laser' ? '🔴' : '🧽'}
          </button>
        ))}
        <span className="wb-sep" />
        <span className="wb-colors">
          {WB_COLORS.map((c) => (
            <button
              key={c}
              className={`dot${color === c ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title="Colour"
            />
          ))}
        </span>
        <span className="wb-sep" />
        <button
          className="wb-btn size"
          onClick={() => setSize(WB_SIZES[(WB_SIZES.indexOf(size) + 1) % WB_SIZES.length])}
          title="Pen size"
        >
          — {size} —
        </button>
        <button className="wb-btn" onClick={wbClear} title="Clear this slide">
          🧹
        </button>
        <button className="wb-btn" onClick={() => setWbOn(false)} title="Close (W)">
          ✖
        </button>
      </div>

      {/* overview */}
      <div id="overview" className={overview ? 'on no-print' : 'no-print'} onClick={(e) => {
        if (e.target === e.currentTarget) setOverview(false);
      }}>
        <h3>All Slides — এই চ্যাপ্টারের সব স্লাইড</h3>
        <div className="ohint">
          যেকোনো কার্ডে ক্লিক করে সরাসরি সেই স্লাইডে যাও &nbsp;·&nbsp; বন্ধ করতে <b>Esc</b>
        </div>
        <div className="ogrid">
          {slides.map((s, n) => (
            <button
              key={n}
              className={`ocard${n === i ? ' cur' : ''}`}
              onClick={() => {
                go(n);
                setOverview(false);
              }}
            >
              <div className="on">SLIDE {n + 1}</div>
              <div className="ot">{s.key.replace(/<[^>]+>/g, '')}</div>
              <div className="ok2">{s.kind}</div>
            </button>
          ))}
        </div>
      </div>

      {/* help */}
      <div id="help" className={help ? 'on no-print' : 'no-print'} onClick={(e) => {
        if (e.target === e.currentTarget) setHelp(false);
      }}>
        <div className="box">
          <h3>Keyboard Shortcuts — কীবোর্ড শর্টকাট</h3>
          {[
            ['পরের স্লাইড', '→ / Space'],
            ['আগের স্লাইড', '←'],
            ['পরের উত্তরটি দেখাও (একটি একটি করে)', 'R'],
            ['এই স্লাইডের সব উত্তর একসাথে', 'A'],
            ['সব স্লাইড (Overview)', 'O'],
            ['বাংলা লুকাও / দেখাও', 'B'],
            ['Whiteboard (draw / highlight / laser)', 'W'],
            ['ডার্ক মোড', 'D'],
            ['ফুলস্ক্রিন', 'F'],
            ['প্রথম / শেষ স্লাইড', 'Home / End'],
            ['বন্ধ করো', 'Esc'],
          ].map(([label, key]) => (
            <div className="row" key={label}>
              <span>{label}</span>
              <span>
                {key.split(' / ').map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
              </span>
            </div>
          ))}
          {(nav?.prev || nav?.next) && (
            <div className="row" style={{ marginTop: 10 }}>
              {nav?.prev ? (
                <Link className="tbtn" href={`/decks/${nav.prev.id}`}>
                  ← {plain(nav.prev.title)}
                </Link>
              ) : (
                <span />
              )}
              {nav?.next && (
                <Link className="tbtn" href={`/decks/${nav.next.id}`}>
                  {plain(nav.next.title)} →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {hint && !word && (
        <div
          className={`wq-tip ${hint.above ? 'above' : 'below'}`}
          style={{
            left: hint.x,
            top: hint.y,
            transform: `translate(-50%, ${hint.above ? '-100%' : '0'})`,
          }}
        >
          {hint.bn}
        </div>
      )}

      {word && (
        <WordModal
          entry={word}
          onClose={() => setWord(null)}
          onPick={(w) => {
            const e = lex.lookup.get(norm(w));
            if (e) setWord(e);
          }}
        />
      )}
    </div>
  );
}
