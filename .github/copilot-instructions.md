# Stash – Coding Agent Instructions

Trust these instructions. Only search the codebase if information here is incomplete or wrong.

## What This Repository Is

**Stash** is a bookmark manager with three sub-projects in one repo:

| Sub-project | Path       | Stack                                    | Purpose                           |
| ----------- | ---------- | ---------------------------------------- | --------------------------------- |
| Mobile app  | `/` (root) | Expo 54 / React Native 0.81 / TypeScript | iOS & Android app                 |
| PWA         | `pwa/`     | React 19 / Vite 7 / TypeScript           | Web app, deployed to GitHub Pages |
| Backend     | `backend/` | PHP (shared cPanel hosting)              | REST API for cloud sync           |

Users save, organize, and search bookmarks. Data is stored locally (AsyncStorage on mobile, localStorage on web) and optionally synced to a PHP backend via JWT-authenticated REST API.

---

## Runtime & Tool Versions

- **Node.js**: 22.x (local); CI uses Node 20 (see `pwa/package.json` CI workflow)
- **npm**: 11.x
- **TypeScript**: ~5.9 (both root and `pwa/`)
- **Expo CLI**: bundled via `expo` package (use `npx expo …`)
- **PHP**: deployed on MilesWeb cPanel shared hosting (no local PHP tooling needed)

---

## Mobile App (Root)

### Bootstrap & Run

```bash
# Always run first — installs all dependencies
npm install

# Start Expo dev server (scan QR with Expo Go, or press i/a for simulator)
npm start              # alias for: npx expo start
npm run ios            # run iOS simulator build
npm run android        # run Android emulator build
```

### TypeScript Check

```bash
npx tsc --noEmit       # exits 0 (clean) — run from repo root
```

### Lint

```bash
npm run lint           # alias for: npx expo lint
```

**Known pre-existing lint warning** (not a build failure):

- `app/(tabs)/collections.tsx` line 37: `'renderItem' is assigned a value but never used`

There are **no tests** in the mobile app.

### Key Configuration Files

| File               | Purpose                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `app.json`         | Expo app config (name: Stash, slug: stash, bundle ID: `com.anonymous.stash`) |
| `tsconfig.json`    | Extends `expo/tsconfig.base`; strict mode; `@/*` maps to repo root           |
| `eslint.config.js` | Uses `eslint-config-expo/flat`; ignores `dist/*`                             |
| `package.json`     | Scripts: `start`, `android`, `ios`, `web`, `lint`, `reset-project`           |

### Architecture

- **File-based routing** via `expo-router`. All screens live under `app/`.
- **State management**: React Context + `useReducer` in `lib/context.tsx` (`BookmarksProvider`). Auth state in `lib/auth-context.tsx` (`AuthProvider`).
- **Local persistence**: `@react-native-async-storage/async-storage` via `lib/storage.ts`. Keys are prefixed `pb_`.
- **Cloud sync**: `lib/sync.ts` — merge-on-conflict strategy (bookmarks: last-writer-wins by `updatedAt`; collections: union, local wins; settings: always local).
- **API client**: `lib/api.ts` — all calls to `https://api.stash.slowatcoding.com`.
- **Path alias**: `@/` resolves to the repo root (not `src/`).

### App Directory Layout

```
app/
  _layout.tsx          ← Root layout; wraps AuthProvider + BookmarksProvider
  modal.tsx
  (tabs)/              ← Bottom tab navigator (Bookmarks, Collections, Search, Settings)
  auth/                ← Auth screens (login, register, otp, forgot-password, reset-password)
  bookmark/[id].tsx    ← Bookmark detail/edit (modal)
  bookmark/add.tsx     ← Add bookmark (modal)
  collection/[id].tsx  ← Collection detail
  collection/add.tsx   ← Add collection (modal)
```

### Shared Libraries (`lib/`)

| File               | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `types.ts`         | `Bookmark`, `Collection`, `AppSettings`, `UrlMetadata` interfaces |
| `storage.ts`       | AsyncStorage CRUD for bookmarks/collections/settings              |
| `context.tsx`      | `BookmarksProvider` + `useBookmarks()` hook                       |
| `auth-context.tsx` | `AuthProvider` + `useAuth()` hook                                 |
| `auth-storage.ts`  | Token/user persistence                                            |
| `api.ts`           | Typed REST client (`api.auth.*`, `api.backup.*`)                  |
| `sync.ts`          | Fetch-and-merge sync logic + debounced upload                     |
| `utils.ts`         | `generateId()`, `fetchUrlMetadata()`, URL helpers                 |
| `theme.ts`         | Color constants, `getColors(scheme)`, collection colors/icons     |
| `backup.ts`        | Import/export helpers (JSON file)                                 |

---

## PWA (`pwa/`)

### Bootstrap & Build

```bash
cd pwa

# Install — MUST use --legacy-peer-deps (peer dep conflicts otherwise)
npm install --legacy-peer-deps

# Production build (runs tsc -b then vite build)
npm run build          # outputs to pwa/dist/; succeeds with a bundle-size warning (non-fatal)

# Dev server (proxies /api to https://api.stash.slowatcoding.com)
npm run dev

# Lint
npm run lint
```

**Known pre-existing lint errors** (4 errors, not failures of the CI build):

- `pwa/src/hooks/use-app-color-scheme.ts`: `setState` called synchronously in effect
- `pwa/src/lib/auth-context.tsx`: same + fast-refresh export warning
- `pwa/src/lib/context.tsx`: fast-refresh export warning

The CI **only runs `npm run build`**, not lint. Do not treat the above lint errors as regressions.

### PWA Architecture

The PWA is a near-mirror of the mobile app: same context/auth/api/sync pattern. Key difference: uses `localStorage` instead of AsyncStorage, and `react-router-dom` for routing.

```
pwa/src/
  App.tsx              ← Router + providers root
  lib/                 ← Mirrors root lib/ (api.ts, context.tsx, sync.ts, etc.)
  pages/               ← One file per route
  components/          ← Shared UI components
  hooks/               ← use-app-color-scheme, use-background-sync, etc.
```

### Key PWA Config

| File                    | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `pwa/vite.config.ts`    | Dev proxy for `/api`; PWA manifest (theme: #7C3AED) |
| `pwa/tsconfig.app.json` | TypeScript config for source                        |
| `pwa/eslint.config.js`  | typescript-eslint + react-hooks + react-refresh     |

---

## Backend (`backend/`)

PHP REST API. **No local build or run steps** — it is uploaded to cPanel hosting.

```
backend/
  schema.sql           ← MySQL schema (users, otps, backups tables)
  config/
    config.php         ← DB credentials + JWT_SECRET (fill in before deploying)
    database.php       ← PDO connection factory
  middleware/
    auth.php           ← JWT bearer token validation
    cors.php           ← CORS headers
  utils/
    jwt.php            ← JWT encode/decode
    mailer.php         ← OTP email via PHP mail()
  api/
    auth/              ← register, login, verify-otp, resend-otp, me, forgot-password, reset-password
    backup/            ← upload, latest, list
```

API base URL: `https://api.stash.slowatcoding.com`

When modifying PHP files, edit them locally and upload to the cPanel server via File Manager or FTP.

---

## CI/CD

One GitHub Actions workflow: `.github/workflows/deploy-pwa.yml`

- **Trigger**: push to `main`
- **Steps**: checkout → Node 20 setup → `npm ci --legacy-peer-deps` (in `pwa/`) → `npm run build` (in `pwa/`) → deploy `pwa/dist` to GitHub Pages
- **What it validates**: PWA TypeScript compiles (`tsc -b`) and Vite builds successfully
- **What it does NOT check**: mobile app TypeScript, lint, or any tests

To replicate CI locally:

```bash
cd pwa
npm ci --legacy-peer-deps
npm run build
```

---

## Making Changes Safely

1. **Mobile app change**: Run `npx tsc --noEmit` (from root) and `npm run lint`. Both should pass (the one pre-existing warning is acceptable).
2. **PWA change**: Run `cd pwa && npm run build`. TypeScript errors will fail the CI. Lint errors are pre-existing and do not block CI.
3. **Backend change**: No local validation tooling. Manually review PHP logic.
4. **Always install before building**: `npm install` (root) or `npm install --legacy-peer-deps` (pwa).

## Important Notes

- The `@/` path alias maps to the **repo root**, not a `src/` directory.
- The PWA's `pwa/src/lib/` is a **separate copy** of `lib/` at the root — changes to one do not automatically apply to the other.
- The app has no automated tests (no Jest, no Playwright, no test scripts).
- `npm run reset-project` (root) is a destructive scaffold reset — do not run it.
- The `expo-env.d.ts` file is auto-generated by Expo; do not edit manually.
