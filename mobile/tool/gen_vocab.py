#!/usr/bin/env python3
"""Build a large vocabulary.json for the Tasin app.

Regenerate / extend the bundled word bank. Run from this `tool/` directory.

Setup (one-time):
  pip3 install nltk
  python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
  # English->Bangla meanings (open data):
  curl -sL -o dict.rar https://raw.githubusercontent.com/MinhasKamal/BengaliDictionary/download/BengaliDictionary_17.rar
  bsdtar -xf dict.rar          # -> BengaliDictionary_17.txt  (format: |word|meaning)
  # common-word frequency list:
  curl -sL -o common.txt https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt

Then:  python3 gen_vocab.py

Sources combined:
  - BengaliDictionary_17.txt : accurate English->Bangla meanings
  - common.txt               : common English words by frequency (quality/ordering filter)
  - WordNet (nltk)           : part of speech, synonyms, antonyms, example sentence

Output entries match the app's VocabWord schema:
  {word, pos, bn, synonyms[], antonyms[], example}
"""
import json, re, os
from collections import OrderedDict
from nltk.corpus import wordnet as wn

SCRATCH = os.path.dirname(os.path.abspath(__file__))  # inputs live next to this script
OUT = os.path.normpath(os.path.join(SCRATCH, "..", "assets", "vocabulary.json"))
TARGET = 3200

# ---- 1. English->Bangla meanings (keep up to 2 distinct meanings per word) ----
bn_map = OrderedDict()
with open(f"{SCRATCH}/BengaliDictionary_17.txt", encoding="utf-8") as f:
    for line in f:
        line = line.strip().lstrip("﻿")
        if not line or line.count("|") < 2:
            continue
        _, word, bn = line.split("|", 2)
        word = word.strip().lower()
        bn = bn.strip()
        if not word or not bn:
            continue
        # plain single English words only (no spaces, hyphens, digits, apostrophes)
        if not re.fullmatch(r"[a-z]{2,}", word):
            continue
        meanings = bn_map.setdefault(word, [])
        if bn not in meanings and len(meanings) < 2:
            meanings.append(bn)

# ---- 2. Common-word ordering ----
common = []
with open(f"{SCRATCH}/common.txt", encoding="utf-8") as f:
    for line in f:
        w = line.strip().lower()
        if re.fullmatch(r"[a-z]{3,}", w):
            common.append(w)

# Skip the most trivial function words; learners want content words.
STOP = set("""the of and to in is was he for it with as his on be at by i this had not
are but from or have an they which one you were her all she there would their we him been
has when who will more no if out so said what its about into than them can only other new
some could time these two may then do first any my now such like our over man me even most
made after also did many before must through back years where much your way well down should
because each just those people mr how too little state good very make world still see own men
work long get here between both life being under never day same another know while last might
us great old year off come since against go came right used take three states himself few house
use during without again place american around however home small found thought went say part
once general high upon school every don does got united left number course war until always
away something fact though water less public put thing almost hand enough far took head yet
government system better set told nothing night end why called didnt eyes find going look asked
later knew""".split())

# ---- 3. WordNet enrichment ----
WN_POS = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}

def is_proper_noun(word):
    """True if the word is only a named entity (e.g. Alaska, Tuesday)."""
    syns = wn.synsets(word)
    if not syns:
        return False
    # If the canonical lemma of every sense is capitalised, it's a proper noun.
    caps = 0
    for s in syns:
        if any(l.name().lower() == word and l.name()[0].isupper()
               for l in s.lemmas()):
            caps += 1
    return caps == len(syns)

def clean(name, word):
    name = name.replace("_", " ")
    # drop multi-word, abbreviations (all-caps), very short, or proper nouns
    if " " in name or name.isupper() or len(name) <= 2 or name[0].isupper():
        return None
    if name.lower() == word:
        return None
    return name

def enrich(word):
    syns = wn.synsets(word)
    if not syns:
        return "", [], [], ""
    pos = WN_POS.get(syns[0].pos(), "")
    synonyms, antonyms = [], []
    example = ""
    for s in syns[:4]:
        for l in s.lemmas():
            n = clean(l.name(), word)
            if n and n not in synonyms:
                synonyms.append(n)
            for a in l.antonyms():
                an = clean(a.name(), word)
                if an and an not in antonyms:
                    antonyms.append(an)
        if not example and s.examples():
            ex = s.examples()[0]
            if word in ex.lower():
                example = ex[0].upper() + ex[1:]
    return pos, synonyms[:6], antonyms[:4], example

# ---- 4. Build, common words first then remaining dictionary words ----
ordered = [w for w in common if w in bn_map and w not in STOP]
seen = set(ordered)
for w in bn_map:
    if w not in seen and w not in STOP:
        ordered.append(w)

def is_inflection(word):
    """Skip plurals / verb forms whose base form is also available."""
    for p in ("n", "v", "a", "r"):
        base = wn.morphy(word, getattr(wn, {"n": "NOUN", "v": "VERB",
                                            "a": "ADJ", "r": "ADV"}[p]))
        # Drop the inflected form if its base is a real word (in our dict or WordNet).
        if base and base != word and (base in bn_map or wn.synsets(base)):
            return True
    return False

out = []
for w in ordered:
    if len(out) >= TARGET:
        break
    if is_proper_noun(w) or is_inflection(w):
        continue
    pos, syns, ants, ex = enrich(w)
    out.append({
        "word": w.capitalize(),
        "pos": pos,
        "bn": ", ".join(bn_map[w]),
        "synonyms": syns,
        "antonyms": ants,
        "example": ex,
    })

out.sort(key=lambda e: e["word"].lower())
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=0, separators=(",", ":"))

with_syn = sum(1 for e in out if e["synonyms"])
with_ex = sum(1 for e in out if e["example"])
with_pos = sum(1 for e in out if e["pos"])
print(f"wrote {len(out)} words")
print(f"  with POS: {with_pos}  with synonyms: {with_syn}  with example: {with_ex}")
print("sample:", json.dumps(out[100], ensure_ascii=False))
