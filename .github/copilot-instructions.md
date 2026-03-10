# Copilot Instructions — Stash

## Project Overview

**Stash** is a bookmark manager with two clients sharing a common PHP backend:

1. **React Native app** — Expo (SDK 54) + Expo Router v6, lives in the repo root.
2. **PWA** — React 19 + Vite + react-router-dom v7, lives in `pwa/`.

Users save URLs with metadata (title, description, cover image, favicon), organise them into nested collections, and tag them for search. Data is stored locally and optionally synced to the cloud via a JWT-authenticated backup API.

---

## Backend

- **API base**: `https://api.stash.slowatcoding.com`
- **Language**: PHP — source lives in `backend/`
- **Auth**: Email + password → OTP email → JWT token
- **Endpoints** (all under `/api/`):
  - `auth/register`, `auth/login` — returns nothing on success, sends OTP
  - `auth/verify-otp` — returns `{ token, user: { id, email } }`
  - `auth/resend-otp`, `auth/me`
  - `backup/upload` (POST), `backup/latest` (GET), `backup/list` (GET)
- All authenticated requests send `Authorization: Bearer <token>`

---

## React Native App (repo root)

### Tech Stack

- **Framework**: Expo ~54 / React Native 0.81 / React 19
- **Navigation**: Expo Router v6 (file-based, `app/` directory)
- **State**: React Context + `useReducer` — see `lib/context.tsx`
- **Storage**: `@react-native-async-storage/async-storage` via `lib/storage.ts`
- **Icons**: `@expo/vector-icons` — use `Ionicons` exclusively
- **Language**: TypeScript (strict)
- **Styling**: `StyleSheet.create` — no Tailwind/NativeWind

### Project Structure

```
app/
  _layout.tsx          # Root layout: AuthProvider > BookmarksProvider > Stack
  (tabs)/              # Bottom tab screens (index, search, collections, settings)
  auth/                # Auth flow: login.tsx, otp.tsx, register.tsx
  bookmark/            # [id].tsx (edit modal), add.tsx (add modal)
  collection/          # [id].tsx (collection detail), add.tsx (add modal)
components/            # Shared UI components
hooks/
  use-app-color-scheme.ts
  use-background-sync.ts   # Syncs on app focus when signed in
lib/
  api.ts               # Typed fetch wrapper + api.auth.* / api.backup.* methods
  auth-context.tsx     # AuthProvider + useAuth() — login/register/OTP/logout
  auth-storage.ts      # AsyncStorage helpers for JWT token + StoredUser
  context.tsx          # BookmarksProvider + useBookmarks() — full CRUD + auto-upload
  storage.ts           # AsyncStorage read/write for bookmarks/collections/settings
  sync.ts              # mergeData() + fetchAndMerge() + uploadData()
  theme.ts             # getColors(), spacing, typography, radius, COLLECTION_*, TAG_COLORS
  types.ts             # Bookmark, Collection, AppSettings, UrlMetadata
  utils.ts             # generateId(), extractDomain(), formatDate()
  backup.ts            # Local JSON export/import backup logic
```

### Auth Flow (React Native)

- `AuthProvider` wraps the entire app (outside `BookmarksProvider`) in `app/_layout.tsx`.
- `useAuth()` exposes: `user`, `token`, `loading`, `pendingEmail`, `login()`, `register()`, `verifyOtp()`, `resendOtp()`, `logout()`.
- Credentials are persisted to AsyncStorage via `lib/auth-storage.ts`.
- Auth screens live under `app/auth/` with a nested `Stack` (`headerShown: false`).
- Navigate to `auth/otp` after calling `login()` or `register()`.

### Cloud Sync (React Native)

- `useBackgroundSync()` (in `hooks/use-background-sync.ts`) runs on mount and every time `AppState` becomes `'active'`.
- It calls `fetchAndMerge()` to reconcile local + remote data, then `uploadData()` to push the merged result.
- Inside `BookmarksProvider`, every mutation schedules a **debounced upload (3 s)** via `scheduleUpload()`.
- Sync is skipped when not signed in (`user` is null).

### Key Conventions (React Native)

#### Theming

```tsx
const scheme = useAppColorScheme() // 'light' | 'dark'
const colors = getColors(scheme) // full palette from lib/theme.ts
```

- Use `spacing`, `typography`, and `radius` from `lib/theme.ts` — never hardcode pixel values.
- `getTagColor(tag)` returns `{ bg, text }` for consistent tag pill colours.

#### State / Context

- Access all state through `useBookmarks()` from `lib/context.tsx`.
- Available actions: `ADD_BOOKMARK`, `UPDATE_BOOKMARK`, `DELETE_BOOKMARK`, `ADD_COLLECTION`, `UPDATE_COLLECTION`, `DELETE_COLLECTION`, `UPDATE_SETTINGS`, `RESTORE`, `LOAD`.
- `getAllTags()` returns a sorted array of all unique tags across bookmarks.
- Never mutate state directly; always go through the context.

```tsx
const {
  bookmarks,
  collections,
  settings,
  loading,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  addCollection,
  updateCollection,
  deleteCollection,
  updateSettings,
  restore,
  getAllTags,
} = useBookmarks()
```

#### Navigation

- Use `expo-router` primitives: `useRouter()`, `useLocalSearchParams()`, `Link`.
- Modal screens: `presentation: 'modal'`, `headerShown: false` (configured in `app/_layout.tsx`).
- Dynamic routes use bracket filenames: `bookmark/[id].tsx`, `collection/[id].tsx`.

#### Components

- Define a typed `interface Props` for every component.
- Use `SafeAreaView` from `react-native-safe-area-context` (not RN core) for root screen containers.
- Use `TouchableOpacity` with `activeOpacity={0.75}` for pressable items.
- Use `expo-image` (`Image` from `expo-image`) for remote images — not RN's built-in `Image`.

#### Icons

- `import { Ionicons } from '@expo/vector-icons'` — use Ionicons names only (e.g. `'bookmark-outline'`, `'folder'`, `'add'`).

---

## PWA (`pwa/`)

### Tech Stack

- **Framework**: React 19 + Vite 7
- **Routing**: react-router-dom v7 (`BrowserRouter` + `Routes`)
- **Icons**: `lucide-react` — use Lucide icon components (e.g. `Home`, `Search`, `FolderOpen`, `X`, `Pencil`, `Trash2`)
- **PWA**: `vite-plugin-pwa` with Workbox; manifest configured in `vite.config.ts`
- **Language**: TypeScript (strict)
- **Styling**: Inline styles with the shared theme system — no CSS frameworks, minimal use of `index.css` (only global resets and `.page-scroll`)

### Project Structure

```
pwa/
  vite.config.ts         # Vite + VitePWA config; dev proxy → api.stash.slowatcoding.com
  src/
    App.tsx              # BrowserRouter + Routes; BookmarksProvider > AuthProvider
    main.tsx
    index.css            # Global resets + .page-scroll utility class
    components/
      TabLayout.tsx      # Bottom tab bar (Home/Search/Collections/Settings) + <Outlet>
      BookmarkCard.tsx
      CollectionCard.tsx
      ContextMenu.tsx
      EmptyState.tsx
      FAB.tsx
      ModalPage.tsx      # Full-screen modal wrapper with header, close button, save action
      SearchBar.tsx
    hooks/
      use-app-color-scheme.ts  # Reads settings + window.matchMedia for dark/light
      use-background-sync.ts   # Syncs on mount + visibilitychange
    lib/
      api.ts             # Same API wrapper as the RN app (fetch-based)
      auth-context.tsx   # AuthProvider + useAuth() — synchronous localStorage variant
      auth-storage.ts    # localStorage helpers (synchronous, no async/await)
      context.tsx        # BookmarksProvider + useBookmarks() — identical shape to RN app
      storage.ts         # localStorage read/write for bookmarks/collections/settings
      sync.ts            # mergeData() + fetchAndMerge() + uploadData()
      theme.ts           # getColors(), spacing, typography, radius (px strings), COLLECTION_*, TAG_COLORS
      types.ts           # Bookmark, Collection, AppSettings, UrlMetadata, StoredUser
      utils.ts           # generateId(), extractDomain(), formatDate()
    pages/
      HomePage.tsx
      SearchPage.tsx
      CollectionsPage.tsx
      CollectionDetailPage.tsx
      SettingsPage.tsx
      AddBookmarkPage.tsx
      EditBookmarkPage.tsx
      AddCollectionPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      OtpPage.tsx
```

### Auth Flow (PWA)

- `AuthProvider` is inside `BookmarksProvider` in `App.tsx` (opposite nesting order to RN).
- `auth-storage.ts` uses synchronous `localStorage` — no `async/await`.
- Auth routes: `/auth/login`, `/auth/register`, `/auth/otp`.
- After `login()` or `register()`, navigate to `/auth/otp`.

### Cloud Sync (PWA)

- `useBackgroundSync()` runs on mount and on `document.visibilitychange` (tab focus).
- Same merge logic as the RN app (`mergeData` from `lib/sync.ts`).

### Routing (PWA)

```tsx
// Tab screens wrapped by TabLayout (renders <Outlet> + bottom tab bar)
/home, /search, /collections, /settings

// Full-screen modal pages (rendered outside TabLayout)
/bookmark/add, /bookmark/:id
/collection/add, /collection/:id

// Auth pages
/auth/login, /auth/register, /auth/otp
```

### Theming (PWA)

```tsx
const scheme = useAppColorScheme() // 'light' | 'dark'
const colors = getColors(scheme) // AppColors from pwa/src/lib/theme.ts
```

- `typography` values use CSS `lineHeight` strings (e.g. `'24px'`), unlike the RN app which uses numeric values.
- Pass `colors` as a prop to components; do not import theme globals.
- Use `ModalPage` component for full-screen add/edit screens — pass `title`, `onClose`, `onSave`, `children`, `colors`.

### PWA Component Conventions

- All styling via inline `style` objects using `colors.*`, `spacing.*`, `radius.*`.
- `WebkitTapHighlightColor: 'transparent'` on interactive elements.
- Use `lucide-react` icons — import named components (e.g. `import { X, Pencil } from 'lucide-react'`).
- Scrollable content areas use `className='page-scroll'` (defined in `index.css`).
- No `SafeAreaView` — use `padding: 'env(safe-area-inset-bottom, 0px)'` for bottom safe areas on tab bar.

---

## Shared Conventions

### Core Data Types (identical in both apps)

```ts
interface Bookmark {
  id: string
  url: string
  title: string
  subtitle: string
  imageUri?: string
  faviconUri?: string
  tags: string[]
  collectionId?: string
  createdAt: number
  updatedAt: number
}
interface Collection {
  id: string
  name: string
  parentId?: string
  color: string
  icon: string
  createdAt: number
}
interface AppSettings {
  themePreference: 'light' | 'dark' | 'system'
}
interface UrlMetadata {
  title: string
  description: string
  imageUrl?: string
  faviconUrl?: string
}
interface StoredUser {
  id: number
  email: string
}
```

### New Entities

- Generate IDs with `generateId()` from `lib/utils.ts`.
- Timestamps use `Date.now()` (Unix ms).

### Collection Colors & Icons

- Pick colors from `COLLECTION_COLORS` and icons from `COLLECTION_ICONS` (both in `lib/theme.ts`).
- RN icons use Ionicons names; PWA icons use Lucide names — these differ (e.g. `'code-slash'` vs `'code-2'`).

### Code Style

- Functional components only; no class components.
- Use `useCallback` for handlers passed as props.
- Keep screen/page logic in the screen file; extract reusable UI into `components/`.
- No default exports from `lib/` utility files; named exports only. Screen/component files use default exports.

**React Native specific:**

- `StyleSheet.create` at the bottom of each file; group styles by component section.
- Prefer explicit style composition: `[styles.base, { color: colors.text }]`.

**PWA specific:**

- All styles are inline objects — no `StyleSheet.create`.
- Avoid adding CSS classes; use `index.css` only for truly global concerns.
