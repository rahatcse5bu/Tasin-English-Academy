# Deploying to cPanel via GitHub Actions (FTP auto-deploy)

This repo auto-deploys on every push to `main`:

| App | Runtime | cPanel path | URL |
|-----|---------|-------------|-----|
| Frontend (Next.js 14, SSR) | Node.js App (Passenger) | `/home/tasinaca/public_html/frontend` | `https://tasinacademy.com` |
| Backend (NestJS + MongoDB) | Node.js App (Passenger) | `/home/tasinaca/api.tasinacademy.com` | `https://api.tasinacademy.com` |

> **Why Node apps, not static hosting?** The frontend uses `export const dynamic = 'force-dynamic'`
> and server components that fetch at request time — it must run a live Node server (`next start`),
> so a static FTP upload would not work. We use Next.js **standalone** output so only a small,
> self-contained bundle is shipped. The backend runs `node dist/main.js`.

The GitHub Actions workflows ([deploy-frontend.yml](.github/workflows/deploy-frontend.yml),
[deploy-backend.yml](.github/workflows/deploy-backend.yml)) build in CI, then **delta-sync** files
over FTPS (only changed files upload after the first run) and touch `tmp/restart.txt` to make
Passenger reload the app.

---

## ⚠️ Do this first — secret leak

`backend/.env` is committed to git, exposing `MONGODB_URI` and `JWT_SECRET`.

```bash
git rm --cached backend/.env
echo ".env" >> backend/.gitignore
git commit -m "Stop tracking backend/.env"
```

Then **rotate** the MongoDB password and `JWT_SECRET`, and set the new values only on the server
(Step 3 below). The `.env` is excluded from FTP uploads so the server copy is never overwritten.

---

## Step 1 — One-time cPanel setup: register both Node.js apps

In cPanel → **Setup Node.js App** → **Create Application**.

### Frontend
- **Node.js version:** 20.x (match the workflow)
- **Application mode:** Production
- **Application root:** `public_html/frontend`
- **Application URL:** your main domain (`tasinacademy.com`)
- **Application startup file:** `server.js`  *(provided by Next.js standalone output)*
- **Environment variables:** none required at runtime (`NEXT_PUBLIC_*` are baked in at build time).
  Optionally `NODE_ENV=production`.
- Click **Create**.

### Backend
- **Node.js version:** 20.x
- **Application mode:** Production
- **Application root:** `api.tasinacademy.com`  *(this is the subdomain's document root — see Step 2)*
- **Application URL:** `api.tasinacademy.com`
- **Application startup file:** `main.js`  *(a single self-contained bundle produced by CI — see note below)*
- **Environment variables** (the real secrets — these replace `backend/.env`):
  | Key | Value |
  |-----|-------|
  | `NODE_ENV` | `production` |
  | `MONGODB_URI` | your MongoDB Atlas/connection string |
  | `JWT_SECRET` | a fresh long random string |
  | `JWT_EXPIRES_IN` | e.g. `7d` |
  | `CORS_ORIGIN` | `https://tasinacademy.com` |
  > `PORT` is provided automatically by Passenger — do **not** set it.
- Click **Create**.

> After Create, cPanel shows a command like `source /home/tasinaca/nodevenv/.../bin/activate`.
> The apps won't fully work until files are uploaded (Step 4), which the workflow does.

## Step 2 — Create the `api.tasinacademy.com` subdomain

cPanel → **Domains / Subdomains** → create `api` under `tasinacademy.com`.
Set its **Document Root** to `api.tasinacademy.com` (cPanel usually does this for you, mapping to
`/home/tasinaca/api.tasinacademy.com`). Then issue an SSL cert for it (AutoSSL / Let's Encrypt) so
`https://api.tasinacademy.com` works.

## Step 3 — Create an FTP account

cPanel → **FTP Accounts**. Use the main account or a dedicated one. Note:
- **Server/host** (e.g. `ftp.tasinacademy.com` or the server IP)
- **Username** and **Password**

Confirm the FTP login's home directory:
- If it lands in `/home/tasinaca` → frontend dir is `/public_html/frontend/`, backend is `/api.tasinacademy.com/`.
- If it lands in `/home/tasinaca/public_html` → frontend dir is `/frontend/` and you'll need a
  separate account (or full path) for the backend folder. Easiest: use the **main cPanel FTP
  account**, whose home is `/home/tasinaca`.

## Step 4 — Add GitHub secrets & variables

Repo → **Settings → Secrets and variables → Actions**.

**Secrets** (Secrets tab):
| Name | Value |
|------|-------|
| `FTP_SERVER` | FTP host, e.g. `ftp.tasinacademy.com` |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `FTP_FRONTEND_DIR` | remote dir **with trailing slash**, e.g. `/public_html/frontend/` |
| `FTP_BACKEND_DIR` | e.g. `/api.tasinacademy.com/` |

**Variable** (Variables tab):
| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_BASE` | `https://api.tasinacademy.com` |

> Paths must match the FTP login's home (Step 3). Always include the trailing `/`.
> If your host doesn't support FTPS, change `protocol: ftps` → `protocol: ftp` in both workflows
> (less secure — prefer FTPS).

## Step 5 — Deploy

Push to `main`, or run the workflow manually (Actions → *Deploy Frontend* / *Deploy Backend* →
**Run workflow**). Changing files only under `frontend/**` triggers only the frontend deploy, and
vice-versa.

The **first** run uploads everything (slow — backend ships its `node_modules`). Subsequent runs
use the action's delta sync (a `.ftp-deploy-sync-state.json` left on the server) and upload only
changed files. Each run rewrites `tmp/restart.txt`, which Passenger watches → the app reloads with
the new code automatically.

## Step 6 — Verify

- Backend: open `https://api.tasinacademy.com/api` (the global prefix is `api`). You should get a
  response from Nest, not a cPanel/Passenger error page.
- Frontend: open `https://tasinacademy.com`. The homepage fetches batches/teachers from the API —
  if data loads, CORS + API base are correct.
- If you see a 503/Passenger error: cPanel → Setup Node.js App → check the app log, confirm the
  startup file path, and click **Restart**.

---

## How it works / troubleshooting

- **Restart mechanism:** Passenger reloads when `<app-root>/tmp/restart.txt` changes. The workflows
  regenerate it with a timestamp every run, so it always syncs and always triggers a reload.
- **Frontend env is build-time:** `NEXT_PUBLIC_API_BASE` is compiled into the bundle during
  `npm run build` in CI. To change it, update the GitHub **variable** and re-run the frontend deploy.
- **Backend is bundled, not `node_modules`-shipped:** uploading the backend's 187 MB / 20k-file
  `node_modules` over FTPS took 1.5h+ and timed out. Instead CI runs `nest build` then bundles the
  compiled output with `@vercel/ncc` into a single ~3.4 MB `main.js` (all deps inlined; decorator
  metadata is preserved because `tsc` already emitted it). Only that one file + a minimal
  `package.json` are uploaded — seconds, not hours. **Nothing is installed on the server.**
  > One-time cleanup: if a failed earlier run left a partial `node_modules/` in the backend folder,
  > delete it in cPanel File Manager — the bundled `main.js` doesn't use it.
- **Node version:** keep the cPanel app's Node version aligned with `node-version: '20'` in the
  workflows to avoid native-module mismatches.
- **`server-dir` mismatch** is the most common failure — files land in the wrong folder. Verify by
  FTPing in manually once and noting where you start.
