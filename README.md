# Tasin English Academy

A full-stack platform for **Tasin English Academy** — a virtual online academy for live scheduled classes in HSC and SSC English (1st & 2nd paper) and ICT, at affordable monthly fees (৳350–৳500) for financially non-solvent students.

- **Backend**: NestJS + MongoDB (Mongoose) + JWT auth
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS, fully in Bangla (বাংলা)
- **Live classes**: Google Meet (per-batch link, hidden from visitors)
- **Payments**: bKash / Nagad / Rocket / Cash with Transaction ID + sender number — manual admin approval
- **Exams**: scheduled per batch with Google Form URL; admin enters marks; ranks auto-computed
- **Top performers**: top 3 of each batch's most recent evaluated exam, shown on the homepage
- **Slide classes**: projector-ready HSC English 1st & 2nd Paper decks — passage, sentence-wise Bangla, MCQ, tables, grammar rules and drills, with answers revealed one at a time

## Project structure

```
.
├── backend/    NestJS + MongoDB API (port 4000)
└── frontend/   Next.js + Tailwind site (port 3000)
```

## Slide classes (`/decks`)

Projector-ready lesson decks for HSC English, in Bangla and English.

- **1st Paper (21 chapters)** — passage, বাক্যভিত্তিক বাংলা অর্থ, vocabulary, synonym/antonym,
  summary (EN + বাংলা), MCQ with reasoning, short questions, information-transfer table, flow chart.
- **2nd Paper (3 chapters)** — grammar: rule cards (নিয়ম বাংলায়, উদাহরণ ইংরেজিতে), a solved board
  question, live practice sets, and the academy's magic tricks.

Teaching controls: `→ / ←` navigate · **`R` opens exactly one answer at a time** · `A` opens all ·
`B` hides the Bangla so students translate first · `W` whiteboard (pen / highlighter / laser) ·
`O` slide overview · `D` dark · `F` fullscreen · the PDF button prints a full-answer handout.
`/decks/<id>?s=12` deep-links to a single slide.

**Where the content lives**

Decks are stored in **MongoDB** (`decks` collection) — one document per chapter, with
the paper/unit metadata denormalised onto it and the whole teaching payload in `content`.
The JSON files are the *seed source*, not the runtime source.

```
backend/src/data/hsc_decks/manifest.json   seed: papers → units → chapters
backend/src/data/hsc_decks/<id>.json       seed: one chapter's full content
backend/src/decks/schemas/deck.schema.ts   the Mongo document
backend/src/decks/decks.seed.ts            idempotent upsert-by-slug seeder
backend/src/decks/                         read-only API (no auth, like /api/learn)
frontend/lib/deck/build.ts                 pure slide builders (no DOM)
frontend/components/decks/SlideDeck.tsx    the projector view
frontend/app/deck.css                      deck styles, all scoped under `.tea-deck`
```

**API**

| Route | Returns |
|---|---|
| `GET /api/decks` | library: papers → units → chapters, with teaching counts |
| `GET /api/decks/index` | flat chapter list (search / prerender) |
| `GET /api/decks/:id` | one chapter's full content |
| `GET /api/decks/:id/neighbours` | previous / next chapter in the same paper |

**Seeding**

```bash
npm run seed:decks              # upsert all 24 chapters (safe to re-run)
SEED_WIPE=1 npm run seed:decks  # drop the collection first
npm run seed                    # full seed, decks included
```

Seeding is idempotent (upsert by `slug`) and never clobbers `isPublished`, so you can hide a
chapter from the library without deleting it. If the collection is empty the API seeds itself
on first boot, so a fresh deploy is never blank.

To add a chapter: drop `<id>.json` in `backend/src/data/hsc_decks/`, add it to `manifest.json`,
run `npm run decks:index`, then `npm run seed:decks`.

## Prerequisites

- Node.js 18+
- MongoDB connection string (provided in `backend/.env`)

## Setup

```bash
# Backend
cd backend
npm install
npm run seed   # seed teachers, batches, classes, exams, sample students, admin
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Default credentials (after seed)

- **Admin**: `admin@tasin.edu.bd` / `admin1234`
- **Sample students**: `mehedi@student.local`, `tahmid@student.local`, ... / `student1234`

## Environment

`backend/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.ft6plvl.mongodb.net/tasin-english-academy?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=...
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

The live cluster is `cluster0.ft6plvl` — the real credentials live in `backend/.env`, which is not
committed. The same `MONGODB_URI` works for local and production. For production, just set `CORS_ORIGIN` to your deployed frontend URL and the frontend's `NEXT_PUBLIC_API_BASE` to your deployed backend URL.

`frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_SITE_NAME=তাসিন ইংলিশ একাডেমি
```

## Features

### Visitors (public, no login)
- হোমপেজ with hero, batch cards, **top 3 performers per batch**, teachers, free resources
- `/teachers` — all instructors with bio, qualification, subjects
- `/batches` — list of all active batches (premium ৳500 / 10 seats, general ৳350 / 25+ seats)
- `/batches/:id` — batch details, schedule (in Bangla weekday names), teachers, upcoming classes (Meet link hidden)
- `/resources` — public lecture sheets, tips, hacks, suggestions, best practices
- `/top-performers` — full ranking page

### Students (after login)
- Dashboard with stats and **Google Meet links** for enrolled batches
- `/dashboard/batches/:id` — full batch detail with Meet link
- `/dashboard/payments` — submit bKash/Nagad payment with TrxID + sender number; track approval status
- `/dashboard/attendance` — present/absent/late history + stats
- `/dashboard/exams` — upcoming exams (with Google Form), own results with rank
- `/dashboard/profile` — update profile

### Admin (`/admin`)
- Overview with counts (pending payments highlighted)
- Manage **Teachers**, **Batches** (with multi-day schedule + Meet link), **Classes**, **Students** (enroll/unenroll into batches)
- **Payments** — filter pending, approve/reject with note
- **Attendance** — pick batch + class, mark all enrolled students at once
- **Exams** — create exam with Google Form URL, enter results in bulk → auto-rank
- **Resources** — add/edit/delete tips, hacks, lecture sheets, suggestions (public or batch-scoped)

## API surface

| Path | Auth | Description |
| --- | --- | --- |
| `POST /api/auth/register` | public | student signup |
| `POST /api/auth/login` | public | login (admin or student) |
| `GET /api/users/me` | jwt | current user |
| `PATCH /api/users/me` | jwt | update self |
| `GET /api/users` | admin | list students |
| `PATCH /api/users/:id/enroll/:batchId` | admin | enroll student in batch |
| `GET /api/teachers` | public | active teachers |
| `POST/PATCH/DELETE /api/teachers/:id` | admin | manage teachers |
| `GET /api/batches` | public | active batches (Meet link hidden) |
| `GET /api/batches/me/:id` | jwt | batch with Meet link if enrolled |
| `POST/PATCH/DELETE /api/batches/:id` | admin | manage batches |
| `GET /api/classes?batch=...` | public | classes for batch (Meet hidden) |
| `GET /api/classes/me/:id` | jwt | class with Meet if enrolled |
| `POST/PATCH/DELETE /api/classes/:id` | admin | manage classes |
| `GET /api/payments/me` | jwt | own payment history |
| `POST /api/payments` | jwt | submit payment |
| `GET /api/payments?status=pending` | admin | review queue |
| `PATCH /api/payments/:id/approve` | admin | approve |
| `PATCH /api/payments/:id/reject` | admin | reject |
| `GET /api/attendance/me` | jwt | own attendance |
| `GET /api/attendance/me/stats` | jwt | own counts |
| `POST /api/attendance/mark` | admin | bulk upsert |
| `GET /api/exams?batch=...` | public | exams |
| `GET /api/exams/top-performers?limit=3` | public | top per batch |
| `POST /api/exams/:id/results/bulk` | admin | bulk marks → rank |

## Notes

- **First 2–3 classes free**: configured per batch via `freeClassCount` (default 3). Payment becomes due after that — track via student's payment history.
- **Visitor view of GMeet**: never exposed. The backend strips `gmeetLink` from public batch and class endpoints.
- **Bangla UI**: `lib/format.ts` has `bnNum`, `bnDate`, `bnDateTime`, `bnDay`, `bnTime` helpers and dictionaries for subjects, statuses, resource kinds.
- **Top performers**: aggregates the most recent `evaluated` exam for each batch and returns its top N results (default 3).

## Deployment

- Backend: any Node host (Render/Railway/Fly/EC2). Set env, run `npm run build && npm run start:prod`.
- Frontend: Vercel works out of the box. Set `NEXT_PUBLIC_API_BASE` to the deployed backend URL.
- MongoDB Atlas connection string in `.env` — the same one is used for both local and production as requested.
