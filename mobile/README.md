# Tasin English Academy — Mobile App

A Flutter app (Android / iOS / Web) for **Tasin English Academy**, talking to the
existing NestJS backend in [`../backend`](../backend). One app serves two roles,
decided by the logged-in account:

- **Students** — see their dashboard, upcoming classes (Join Google Meet), smart
  suggestions & study materials, exams (sit via Google Form) and results, top
  performers, attendance, fee payments, profile, and a synthesized notifications feed.
- **Admins** — manage students & enrollment, batches, classes, resources
  (decide *what to share*), exams + results entry, mark attendance, approve/reject
  payments, and manage teacher profiles.

## Architecture

```
lib/
  config.dart                 # API base URL (override with --dart-define=API_BASE=...)
  theme.dart                  # Material 3 palette & component styling
  models/models.dart          # Data models mirroring the backend schemas
  services/
    api_client.dart           # HTTP wrapper (bearer token, error handling)
    api.dart                  # Typed facade — one method per backend route
    auth_provider.dart        # Session: login/register/logout, token persistence
  widgets/common.dart         # Shared UI (Loading, EmptyState, StatusPill, helpers)
  screens/
    auth/                     # login, register
    student/                  # shell + dashboard, classes, resources, exams,
                              #   attendance, payments, profile, notifications, batches
    admin/                    # shell + dashboard, manage_* screens, mark_attendance
```

State: `provider` (auth/session) + `FutureBuilder` per screen. Token is stored
with `shared_preferences` and restored on launch.

## Running

1. **Start the backend** (`../backend`): `npm run start:dev` (listens on `:4000`).
   Seed an admin/login with `npm run seed` if you haven't.

2. **Run the app:**
   ```bash
   flutter pub get
   flutter run                # pick a device/emulator
   ```

### Pointing at the backend

`config.dart` chooses a sensible default automatically:

| Target              | Default API base        |
| ------------------- | ----------------------- |
| Android emulator    | `http://10.0.2.2:4000`  |
| iOS sim / web / etc | `http://localhost:4000` |

Override it for a physical device or a deployed backend:

```bash
flutter run --dart-define=API_BASE=https://your-backend.onrender.com
```

> Cleartext HTTP to localhost is enabled for dev (Android `usesCleartextTraffic`,
> iOS `NSAllowsLocalNetworking`). Production should use an `https://` API base.

## Logins

Use accounts from the backend seed (see `../backend/src/seed.ts`):

- Admin: `admin@tasin.edu.bd` / `admin1234`
- Student: any seeded `*@student.local` / `student1234`, or **Register** a new student.

## Notes

- The backend has **no notification endpoint**, so the notifications screen builds
  a smart feed client-side from upcoming classes, newly shared resources, published
  results, open exams, and payment status.
- **Vocabulary Builder** (Learn tab) bundles ~3,200 common English words with Bangla
  meanings, synonyms, antonyms and example sentences in [`assets/vocabulary.json`](assets/vocabulary.json)
  — works fully offline. The data was generated from the open [MinhasKamal/BengaliDictionary](https://github.com/MinhasKamal/BengaliDictionary)
  (English→Bangla meanings) + a common-word frequency list + WordNet (POS/synonyms/
  antonyms/examples). Regenerate or extend via `scratchpad/gen_vocab.py`.
- The registration **Institution** field is a type-ahead over Barishal City schools &
  colleges ([`lib/data/barishal_institutions.dart`](lib/data/barishal_institutions.dart)),
  but still accepts free text for anything not listed.
- "Take exam" opens the exam's Google Form (`googleFormUrl`); admins enter marks
  in **Exams → Enter results**, and ranks are recomputed server-side.
- Student self-enrollment isn't a backend feature — admins enroll students
  (Students → tap a student → toggle batches), which unlocks that batch's classes,
  Meet links, and batch-scoped resources.
