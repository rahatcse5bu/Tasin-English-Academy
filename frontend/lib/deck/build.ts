/**
 * Slide builders for the HSC decks.
 *
 * Pure functions — no DOM, no React. Each returns { kind, key, title, html },
 * so the same code can render in the browser, in a print view, or on the server.
 * Ported from the standalone deck engine; keep the two in step.
 */
import type { Deck, Slide } from './types';
import { buildLexicon, linkHtml, type Lexicon } from './lexicon';

const BRAND = { name: 'Tasin English Academy', phone: '01722335722' };

/* ---------- helpers ---------- */
function esc(s: any): string {
  return String(s == null ? "" : s)
    /* leave entities the author already wrote (&amp; &nbsp; …) intact */
    .replace(/&(?!(?:[a-zA-Z]+|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/* allows a tiny safe subset of markup written by the author: **bold**, *ital*, ==highlight== */
function fmt(s: any): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/==([^=]+)==/g, '<mark class="kw">$1</mark>')
    .replace(/\*([^*]+)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function bn(s: any) { return '<span class="bn">' + fmt(s) + "</span>"; }
/** fmt(), plus every vocabulary word turned into a tappable lookup. */
function fmtV(s: any, lex: Lexicon | null): string { return linkHtml(fmt(s), lex); }
function chunk(arr: any[], n: number): any[][] {
  var out = [], i;
  for (i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
var LETTER = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
var ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

/* ============================================================
   SLIDE BUILDERS  — each returns {kind, title, html}
   ============================================================ */

function sCover(D: any): any {
  /* grammar decks and passage decks advertise different things */
  var stats = D.rules
    ? [
        { n: D.rules.length, l: "নিয়ম (Rules)", em: "📐" },
        { n: (D.drills || []).reduce(function (a, d) { return a + d.items.length; }, 0), l: "Practice Blanks", em: "✍️" },
        { n: D.boardQ ? D.boardQ.items.length : 0, l: "বোর্ড প্রশ্ন সমাধান", em: "📝" },
        { n: (D.tips || []).length, l: "Magic Tricks", em: "💡" }
      ]
    : [
        { n: D.mcq ? D.mcq.length : 0, l: "MCQ (প্রশ্ন ১-ক)", em: "🎯" },
        { n: D.shortQ ? D.shortQ.length : 0, l: "Short Questions (১-খ)", em: "✍️" },
        { n: D.words ? D.words.length : 0, l: "Vocabulary Words", em: "📚" },
        { n: countSentences(D), l: "Sentence-wise বাংলা", em: "🇧🇩" }
      ];
  var html =
    '<div class="cover">' +
      "<div>" +
        '<span class="cover-kicker">' + esc(D.unit || "HSC") + " &nbsp;•&nbsp; " + esc(D.unitName || "") + "</span>" +
        "<h1>" + esc(D.title) + "</h1>" +
        (D.titleBn ? '<div class="h1-bn bn">' + esc(D.titleBn) + "</div>" : "") +
        (D.lede ? '<p class="lede">' + fmt(D.lede) + "</p>" : "") +
        '<div class="cover-meta">' +
          '<span class="chip"><span class="ico">📘</span> ' + esc(D.paperName || "HSC English 1st Paper") + "</span>" +
          '<span class="chip"><span class="ico">📝</span> ' + esc(D.qType || "Seen Passage — Q. 1, 2 &amp; 3") + "</span>" +
          '<span class="chip"><span class="ico">⏱️</span> ' + esc(D.minutes || 45) + " min class</span>" +
          '<span class="chip"><span class="ico">📊</span> Marks: ' + esc(D.marks || "35") + "</span>" +
        "</div>" +
        '<div class="cover-brand">' +
          '<div class="cb-mark">TEA</div>' +
          "<div><div class=\"cb-name\">" + BRAND.name + "</div>" +
          '<div class="cb-sub bn">সরকারি আলেকান্দা কলেজের বিপরীতে, বরিশাল</div></div>' +
          '<div class="cb-phone">' + BRAND.phone + "<small>যোগাযোগ</small></div>" +
        "</div>" +
      "</div>" +
      '<div class="cover-side">' +
        stats.map(function (s) {
          return '<div class="stat-card"><span class="em">' + s.em + '</span><div><div class="n">' +
            s.n + '</div><div class="l bn">' + esc(s.l) + "</div></div></div>";
        }).join("") +
      "</div>" +
    "</div>";
  return { kind: "cover", title: D.title, key: "Cover", html: html, bare: true };
}

function countSentences(D: any) {
  var n = 0;
  (D.passage || []).forEach(function (p) { n += (p.s || []).length; });
  return n;
}

function sRoadmap(D: any): any {
  var items = D.objectives && D.objectives.length ? D.objectives : [
    { t: "Read & understand the passage", d: "মূল প্যাসেজটি শব্দে-শব্দে বুঝে নেওয়া" },
    { t: "Sentence-wise Bangla meaning", d: "প্রতিটি বাক্যের বাংলা অর্থ" },
    { t: "Vocabulary, Synonym & Antonym", d: "গুরুত্বপূর্ণ ও কঠিন শব্দ" },
    { t: "Summary (English + বাংলা)", d: "১০ নম্বরের সারাংশ" },
    { t: "MCQ + Short Questions", d: "বোর্ড প্যাটার্নে উত্তর" },
    { t: "Information Transfer & Flow Chart", d: "টেবিল ও ফ্লো-চার্ট সমাধান" }
  ];
  var html = '<div class="grid g2">' + items.map(function (o, i) {
    return '<div class="obj-item"><div class="num">' + (i + 1) + "</div><div><div class=\"t\">" +
      fmt(o.t) + '</div><div class="d bn">' + fmt(o.d || "") + "</div></div></div>";
  }).join("") + "</div>";
  return { kind: "plan", title: "আজকের ক্লাস-প্ল্যান <span class='sub'>/ Lesson Roadmap</span>", key: "Roadmap", html: html, bnTitle: true };
}

function sPassage(D: any, lex: Lexicon | null): any[] {
  var out = [];
  (D.passage || []).forEach(function (para, pi) {
    var body = '<div class="passage">' +
      '<div class="para-tag"><i></i>' + esc(para.tag || ("Paragraph " + (pi + 1))) + "</div><p>" +
      (para.s || []).map(function (s, si) {
        return '<span class="snum">' + (s.no || si + 1) + "</span>" + fmtV(s.en, lex);
      }).join(" ") +
      "</p></div>";
    out.push({
      kind: "passage",
      title: "The Passage <span class='sub'>— মূল প্যাসেজ (" + (pi + 1) + "/" + D.passage.length + ")</span>",
      key: "Passage " + (pi + 1),
      html: body
    });
  });
  return out;
}

function sTranslation(D: any, lex: Lexicon | null): any[] {
  var rows = [];
  (D.passage || []).forEach(function (para) {
    (para.s || []).forEach(function (s, i) { rows.push(s); });
  });
  var n = 0;
  return chunk(rows, 4).map(function (grp, gi, all) {
    var html = grp.map(function (s) {
      n++;
      return '<div class="tr-row"><div class="n">' + n + '</div><div><div class="en">' +
        fmtV(s.en, lex) + '</div><div class="bn">' + fmt(s.bn) + "</div></div></div>";
    }).join("");
    return {
      kind: "translation",
      title: "বাক্যভিত্তিক বাংলা অর্থ <span class='sub'>/ Sentence-wise Meaning (" + (gi + 1) + "/" + all.length + ")</span>",
      key: "বাংলা " + (gi + 1),
      html: html, bnTitle: true
    };
  });
}

function sWords(D: any): any[] {
  if (!D.words || !D.words.length) return [];
  return chunk(D.words, 6).map(function (grp, gi, all) {
    var html = '<div class="grid g3">' + grp.map(function (w) {
      return '<div class="wcard"><div class="top"><span class="w">' + esc(w.w) + "</span>" +
        (w.pos ? '<span class="tag ' + posCls(w.pos) + '">' + esc(w.pos) + "</span>" : "") +
        (w.pron ? '<span class="pron">' + esc(w.pron) + "</span>" : "") + "</div>" +
        '<div class="bn">' + fmt(w.bn) + "</div>" +
        (w.en ? '<div class="en">' + fmt(w.en) + "</div>" : "") +
        (w.ex ? '<div class="ex">“' + fmt(w.ex) + "”</div>" : "") + "</div>";
    }).join("") + "</div>";
    return {
      kind: "words",
      title: "গুরুত্বপূর্ণ ও কঠিন শব্দার্থ <span class='sub'>/ Key Vocabulary (" + (gi + 1) + "/" + all.length + ")</span>",
      key: "Words " + (gi + 1), html: html, bnTitle: true
    };
  });
}
function posCls(p: any) {
  p = (p || "").toLowerCase();
  if (p.indexOf("verb") === 0 || p === "v") return "v";
  if (p.indexOf("adj") === 0) return "adj";
  if (p.indexOf("adv") === 0) return "adv";
  if (p.indexOf("phr") === 0 || p.indexOf("idio") === 0) return "ph";
  return "n";
}

function sSynAnt(D: any): any[] {
  if (!D.synant || !D.synant.length) return [];
  return chunk(D.synant, 9).map(function (grp, gi, all) {
    var html = '<div class="tw"><table class="t"><thead><tr>' +
      "<th>Word</th><th>বাংলা</th><th>Synonyms (সমার্থক)</th><th>Antonyms (বিপরীত)</th>" +
      "</tr></thead><tbody>" +
      grp.map(function (r) {
        return "<tr><td><span class=\"w\">" + esc(r.w) + "</span></td>" +
          '<td class="bn">' + esc(r.bn || "—") + "</td>" +
          '<td class="syn">' + esc((r.syn || []).join(", ")) + "</td>" +
          '<td class="ant">' + esc((r.ant || []).join(", ")) + "</td></tr>";
      }).join("") +
      "</tbody></table></div>" +
      (gi === all.length - 1
        ? '<div class="callout" style="margin-top:12px"><span>💡</span><div><b>Board Tip:</b> ' +
          "MCQ-তে <b>closest meaning</b> চাইলে প্যাসেজের বাক্যে শব্দটি বসিয়ে দেখো — যে option বসালে বাক্যের অর্থ বদলায় না, সেটাই উত্তর।</div></div>"
        : "");
    return {
      kind: "synant",
      title: "Synonym &amp; Antonym <span class='sub'>— সমার্থক ও বিপরীত শব্দ (" + (gi + 1) + "/" + all.length + ")</span>",
      key: "Syn/Ant " + (gi + 1), html: html
    };
  });
}

function sSummary(D: any, lex: Lexicon | null): any[] {
  var out = [];
  if (D.summaryEn || D.summaryBn) {
    var html = '<div class="grid g2 sum-grid">';
    if (D.summaryEn) {
      html += '<div><span class="sum-label">EN — Model Summary <i style="text-transform:none;font-weight:600">(write in ONE paragraph)</i></span>' +
        '<div class="sum-en">' + fmtV(D.summaryEn, lex) + "</div></div>";
    }
    if (D.summaryBn) {
      html += '<div><span class="sum-label bn">বাংলা — অর্থ বুঝে নাও, মুখস্থ করো না</span>' +
        '<div class="sum-bn">' + fmt(D.summaryBn) + "</div></div>";
    }
    html += "</div>" +
      (D.summaryTip
        ? '<div class="callout" style="margin-top:12px"><span>✍️</span><div>' + fmt(D.summaryTip) + "</div></div>"
        : "");
    out.push({
      kind: "summary",
      title: "Summary &amp; সারাংশ <span class='sub'>— ইংরেজি বাঁয়ে, বাংলা ডানে · Marks 10</span>",
      key: "Summary", html: html
    });
  }
  return out;
}

function sMCQ(D: any): any[] {
  if (!D.mcq || !D.mcq.length) return [];
  var n = 0;
  return chunk(D.mcq, 3).map(function (grp, gi, all) {
    var html = grp.map(function (q) {
      n++;
      return '<div class="mcq" data-mcq><div class="q"><span class="n">' + LETTER[n - 1] + "</span><span>" +
        fmt(q.q) + '</span></div><div class="opts">' +
        q.opts.map(function (o, oi) {
          return '<button class="opt' + (oi === q.ans ? " correct" : "") + '" data-opt><span class="k">' +
            ROMAN[oi] + "</span><span>" + fmt(o) + "</span></button>";
        }).join("") + "</div>" +
        (q.why ? '<div class="why bn">✔ ' + fmt(q.why) + "</div>" : "") +
        "</div>";
    }).join("");
    return {
      kind: "mcq",
      title: "১-ক : MCQ <span class='sub'>— বহুনির্বাচনি (" + (gi + 1) + "/" + all.length + ") · " +
        esc(D.mcqMarks || "0.5×10 = 5") + "</span>",
      key: "MCQ " + (gi + 1), html: html, reveal: true
    };
  });
}

function sShortQ(D: any): any[] {
  if (!D.shortQ || !D.shortQ.length) return [];
  var n = 0;
  return chunk(D.shortQ, 2).map(function (grp, gi, all) {
    var html = grp.map(function (q) {
      n++;
      return '<div class="qa collapsed" data-qa><div class="q"><span class="n">' + LETTER[n - 1] +
        "</span><span>" + fmt(q.q) + '</span><span class="marks">3</span></div>' +
        '<div class="a">' + fmt(q.a) + "</div>" +
        (q.bn ? '<div class="a-bn bn">' + fmt(q.bn) + "</div>" : "") + "</div>";
    }).join("");
    return {
      kind: "shortq",
      title: "১-খ : Short Questions <span class='sub'>— (" + (gi + 1) + "/" + all.length + ") · 3×5 = 15</span>",
      key: "Q&amp;A " + (gi + 1), html: html, reveal: true
    };
  });
}

function sTable(D: any): any[] {
  /* a chapter may drill several tables; older ones carry a single `table` */
  var list = (D.tables && D.tables.length ? D.tables : D.table ? [D.table] : []).filter(Boolean);
  if (!list.length) return [];

  return list.map(function (t: any, ti: number) {
    var html = '<div class="tw"><table class="t"><thead><tr>' +
      t.headers.map(function (h: string) { return "<th>" + esc(h) + "</th>"; }).join("") +
      "</tr></thead><tbody>" +
      t.rows.map(function (r: string[]) {
        return "<tr>" + r.map(function (c) {
          var s = String(c == null ? "" : c);
          /* Everything after the first "@" in a cell is the answer — e.g. "(i) @his people's emancipation".
             Each blank is its own reveal step, so (i), (ii), (iii) open one after another even when
             they sit side by side in the same row. */
          var at = s.indexOf("@");
          if (at > -1) {
            return "<td data-rev>" + fmt(s.slice(0, at)) +
              '<span class="rev-ph">— ? —</span><span class="ans rev-ans inline">' + fmt(s.slice(at + 1)) + "</span></td>";
          }
          return "<td>" + fmt(s) + "</td>";
        }).join("") + "</tr>";
      }).join("") +
      "</tbody></table></div>" +
      '<div class="callout" style="margin-top:12px"><span>🟢</span><div><b>R</b> চেপে (i), (ii), (iii) — একটি করে খালিঘরের উত্তর খোলো, <b>Shift+R</b> চাপলে শেষটি আবার লুকাবে। ' +
      esc(t.note || "খালিঘর পূরণের সময় passage-এর হুবহু শব্দ ব্যবহার করবে, নিজের ভাষায় লিখবে না।") + "</div></div>";

    var many = list.length > 1;
    return {
      kind: "table",
      title: "২ : Information Transfer <span class='sub'>— " +
        (t.title ? esc(t.title) + " · " : "টেবিল সমাধান · ") +
        (many ? (ti + 1) + "/" + list.length + " · " : "") + "10×0.5 = 5</span>",
      key: many ? "Table " + (ti + 1) : "Table",
      html: html
    };
  });
}

function sFlow(D: any): any[] {
  if (!D.flow) return [];
  var f = D.flow;
  var html = '<div class="flow"><div class="flow-title">' + fmt(f.title) + '</div><div class="flow-items">' +
    f.items.map(function (it, i) {
      var given = i === 0;
      var text = typeof it === "string" ? it : it.t;
      var b = typeof it === "string" ? "" : it.bn;
      return '<div class="flow-box' + (given ? " given revealed" : "") + '"' + (given ? "" : " data-rev") +
        '><span class="n">' + (i + 1) + "</span>" +
        '<span class="rev-ph">— ? —</span><span class="rev-ans inline">' + fmt(text) +
        (b ? '<span class="bn">' + fmt(b) + "</span>" : "") + "</span></div>";
    }).join("") + "</div></div>" +
    '<div class="callout" style="margin-top:14px"><span>🧭</span><div><b>Flow chart rule:</b> ' +
    "১ নম্বর ঘর দেওয়া থাকে — বাকি ঘরগুলো <b>passage-এর ক্রম অনুসারে</b>, ছোট ছোট phrase-এ (full sentence নয়) লিখতে হবে। " +
    "<b>R</b> = পরের ঘর, <b>Shift+R</b> = আগেরটি আবার লুকাও।</div></div>";
  return [{
    kind: "flow",
    title: "২ (Or) : Flow Chart <span class='sub'>— ফ্লো-চার্ট সমাধান · 1×5 = 5</span>",
    key: "Flow Chart", html: html
  }];
}

function sExtras(D: any): any[] {
  if (!D.extras || !D.extras.length) return [];
  return D.extras.map(function (x, i) {
    return {
      kind: "extra",
      title: x.title,
      key: x.key || ("Extra " + (i + 1)),
      html: x.html || renderExtra(x)
    };
  });
}
function renderExtra(x: any) {
  if (x.table) {
    return '<div class="tw"><table class="t"><thead><tr>' +
      x.table.headers.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      x.table.rows.map(function (r) {
        return "<tr>" + r.map(function (c) {
          var s = String(c == null ? "" : c);
          if (s.charAt(0) === "@") return '<td class="bn">' + fmt(s.slice(1)) + "</td>";
          return "<td>" + fmt(s) + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>" +
      (x.note ? '<div class="callout" style="margin-top:12px"><span>💡</span><div>' + fmt(x.note) + "</div></div>" : "");
  }
  if (x.list) {
    return '<div class="grid g2">' + x.list.map(function (o) {
      return '<div class="tip ' + (o.type || "") + '"><span class="em">' + (o.em || "▪️") + '</span><div><div class="t">' +
        fmt(o.t) + '</div><div class="d bn">' + fmt(o.d || "") + "</div></div></div>";
    }).join("") + "</div>";
  }
  return "";
}

function sTips(D: any): any[] {
  if (!D.tips || !D.tips.length) return [];
  return chunk(D.tips, 6).map(function (grp, gi, all) {
    var html = '<div class="grid g2">' + grp.map(function (t) {
      return '<div class="tip ' + (t.type || "") + '"><span class="em">' + (t.em || "💡") + '</span><div><div class="t">' +
        fmt(t.t) + '</div><div class="d bn">' + fmt(t.d || "") + "</div></div></div>";
    }).join("") + "</div>";
    return {
      kind: "tips",
      title: "Exam Tips &amp; Tricks <span class='sub'>— পরীক্ষার কৌশল (" + (gi + 1) + "/" + all.length + ")</span>",
      key: "Tips " + (gi + 1), html: html
    };
  });
}

function sRecap(D: any): any[] {
  var pts = D.recap || [];
  var html =
    '<div class="grid g2">' +
      '<div class="card"><div class="eyebrow">Take-away</div><div style="margin-top:12px">' +
        (pts.length
          ? pts.map(function (p, i) {
              return '<div class="obj-item" style="margin-bottom:9px"><div class="num">' + (i + 1) +
                '</div><div class="t bn" style="font-weight:650;font-size:14.5px">' + fmt(p) + "</div></div>";
            }).join("")
          : "") +
      "</div></div>" +
      '<div class="card"><div class="eyebrow">Homework</div><div style="margin-top:12px">' +
        (D.homework || []).map(function (h) {
          return '<div class="tip ok" style="margin-bottom:9px"><span class="em">📌</span><div class="d bn" style="margin:0">' +
            fmt(h) + "</div></div>";
        }).join("") +
      "</div></div>" +
    "</div>" +
    '<div class="cover-brand" style="margin:18px auto 0">' +
      '<div class="cb-mark">TEA</div>' +
      '<div><div class="cb-name">' + BRAND.name + "</div>" +
      '<div class="cb-sub bn">HSC English 1st &amp; 2nd Paper — Special Batch</div></div>' +
      '<div class="cb-phone">' + BRAND.phone + "<small>যোগাযোগ</small></div>" +
    "</div>";
  return [{ kind: "recap", title: "Recap &amp; Homework <span class='sub'>— আজকের সারসংক্ষেপ</span>", key: "Recap", html: html }];
}

/* ============================================================
   GRAMMAR SLIDES — for English 2nd Paper lessons
   Rule → structure → example → live drill → solved board question
   ============================================================ */

/* Rule cards: the RULE is explained in Bangla, the EXAMPLE stays in English. */
function sRules(D: any): any[] {
  if (!D.rules || !D.rules.length) return [];
  var per = D.rulesPerSlide || 2;
  return chunk(D.rules, per).map(function (grp, gi, all) {
    var html = grp.map(function (r) {
      return '<div class="rule">' +
        '<div class="rule-head">' +
          '<span class="rule-no">' + esc(r.no || "") + "</span>" +
          '<span class="rule-name">' + fmt(r.name) + "</span>" +
          (r.tag ? '<span class="rule-tag">' + esc(r.tag) + "</span>" : "") +
        "</div>" +
        '<div class="rule-bn bn">' + fmt(r.bn) + "</div>" +
        (r.formula
          ? '<div class="formula"><span class="formula-l">' + esc(r.formulaLabel || "STRUCTURE") +
            '</span><span class="formula-v">' + fmt(r.formula) + "</span></div>"
          : "") +
        (r.ex ? '<div class="rule-ex">' + fmt(r.ex) + "</div>" : "") +
        (r.note ? '<div class="rule-note bn">⚠️ ' + fmt(r.note) + "</div>" : "") +
        "</div>";
    }).join("");
    return {
      kind: "rules",
      title: fmt(D.rulesTitle || "নিয়ম") + " <span class='sub'>— Rules (" + (gi + 1) + "/" + all.length + ")</span>",
      key: "Rule " + (gi + 1), html: html, bnTitle: true
    };
  });
}

/* Live drill: mentor asks, students answer, then the answer is revealed. */
function sDrill(D: any): any[] {
  if (!D.drills || !D.drills.length) return [];
  return D.drills.map(function (set, si) {
    var html =
      (set.intro ? '<div class="callout" style="margin-bottom:12px"><span>🎤</span><div class="bn">' + fmt(set.intro) + "</div></div>" : "") +
      '<div class="drill">' +
        set.items.map(function (it, i) {
          return '<div class="drill-row" data-rev><span class="drill-n">' + (i + 1) + "</span>" +
            '<div class="drill-q">' + fmt(it.q) + "</div>" +
            '<div class="drill-a rev-ans"><b>' + fmt(it.ans) + "</b>" +
            (it.why ? '<span class="drill-why bn">' + fmt(it.why) + "</span>" : "") + "</div></div>";
        }).join("") +
      "</div>" +
      '<div class="callout" style="margin-top:12px"><span>👁️</span><div class="bn"><b>R</b> চাপলে একটি করে উত্তর খুলবে (অথবা যেকোনো প্রশ্নে ক্লিক করো)। সবগুলো একসাথে দেখতে <b>A</b> চাপো।</div></div>';
    return {
      kind: "drill",
      title: fmt(set.title) + " <span class='sub'>— Practice (" + (si + 1) + "/" + D.drills.length + ")</span>",
      key: "Drill " + (si + 1), html: html, reveal: true, bnTitle: true
    };
  });
}

/* A full board-pattern question, worked out. */
function sBoard(D: any): any[] {
  if (!D.boardQ) return [];
  var b = D.boardQ;
  var html =
    (b.instruction ? '<div class="board-inst">' + fmt(b.instruction) + "</div>" : "") +
    (b.text ? '<div class="passage" style="margin-bottom:12px"><p>' + fmt(b.text) + "</p></div>" : "") +
    (b.bank ? '<div class="formula" style="margin-bottom:12px"><span class="formula-l">WORD BANK</span><span class="formula-v">' + fmt(b.bank) + "</span></div>" : "") +
    '<div class="tw"><table class="t"><thead><tr><th class="idx">No.</th><th>Answer</th><th>কেন — যুক্তি</th></tr></thead><tbody>' +
      b.items.map(function (it, i) {
        return '<tr data-rev><td class="idx">' + (i + 1) + "</td>" +
          '<td><span class="rev-ph">— ? —</span><span class="ans rev-ans inline">' + fmt(it.ans) + "</span></td>" +
          '<td class="bn"><span class="rev-ans inline">' + fmt(it.why || "") + "</span></td></tr>";
      }).join("") +
    "</tbody></table></div>";
  return [{
    kind: "board",
    title: "বোর্ড প্রশ্ন — সমাধান <span class='sub'>/ Solved Board Question</span>",
    key: "Board Q", html: html, bnTitle: true
  }];
}

/* ============================================================
   DECK ASSEMBLY
   Each section appears only if the chapter supplies its data,
   so the same engine serves 1st Paper passages and 2nd Paper grammar.
   ============================================================ */
function build(D: Deck): Slide[] {
  var s: Slide[] = [];
  /* the chapter's own vocabulary, so a word in the passage can be tapped */
  var lex = D.passage ? buildLexicon(D) : null;
  s.push(sCover(D));
  s.push(sRoadmap(D));
  s = s.concat(sRules(D));
  s = s.concat(sBoard(D));
  s = s.concat(sDrill(D));
  s = s.concat(sPassage(D, lex));
  s = s.concat(sTranslation(D, lex));
  s = s.concat(sWords(D));
  s = s.concat(sSynAnt(D));
  s = s.concat(sSummary(D, lex));
  s = s.concat(sMCQ(D));
  s = s.concat(sShortQ(D));
  s = s.concat(sTable(D));
  s = s.concat(sFlow(D));
  s = s.concat(sExtras(D));
  s = s.concat(sTips(D));
  s = s.concat(sRecap(D));
  return s;
}

export { build, fmt, esc, BRAND };
