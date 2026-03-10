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
- **Animation**: `react-native-reanimated` (used in `FAB` for animated show/hide)

### Project Structure

```
app/
  _layout.tsx          # Root layout: AuthProvider > BookmarksProvider > Stack
  (tabs)/
    _layout.tsx        # Tab bar config — Bookmarks, Collections, Search, Settings
    index.tsx          # Home: masonry grid of bookmarks with search + filter chips
    collections.tsx    # Collections: 2-col grid of root collections, nested children inline
    search.tsx         # Dedicated search screen
    settings.tsx       # Theme, backup, cloud sync, sign-in/out
  auth/                # Auth flow: login.tsx, otp.tsx, register.tsx
  bookmark/            # [id].tsx (edit modal), add.tsx (add modal)
  collection/          # [id].tsx (collection detail masonry), add.tsx (create/edit modal)
components/
  BookmarkMasonryCard.tsx  # Card for masonry grid — cover image, title, tags, collection badge
  CollectionCard.tsx       # Collection card with icon, color bar, bookmark count
  ContextMenu.tsx          # Floating dropdown menu (Modal-based, measures trigger position)
  EmptyState.tsx           # Centred icon + title + subtitle placeholder
  FAB.tsx                  # Animated floating action button (spring in/out via Reanimated)
  SearchBar.tsx            # Exports: SearchBar, FilterChip, FilterRow
hooks/
  use-app-color-scheme.ts  # Returns effective scheme: reads settings, falls back to RN useColorScheme()
  use-background-sync.ts   # Syncs on mount + AppState 'active'
lib/
  api.ts               # Typed fetch wrapper + api.auth.* / api.backup.* methods
  auth-context.tsx     # AuthProvider + useAuth() — login/register/OTP/logout
  auth-storage.ts      # AsyncStorage helpers for JWT token + StoredUser
  context.tsx          # BookmarksProvider + useBookmarks() — full CRUD + debounced upload
  storage.ts           # Async AsyncStorage read/write; keys prefixed pb_
  sync.ts              # mergeData(), fetchAndMerge(), uploadData()
  theme.ts             # getColors(), spacing, typography (numeric lineHeight), radius, COLLECTION_*, TAG_COLORS
  types.ts             # Bookmark, Collection, AppSettings, UrlMetadata
  utils.ts             # generateId, extractDomain, normalizeUrl, getFaviconUrl, fetchUrlMetadata, searchFilter, formatDate
  backup.ts            # Local JSON backup via expo-file-system + expo-sharing + expo-document-picker
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
- `lib/sync.ts` exports: `mergeData`, `uploadData`, `fetchAndMerge`, `SyncData`.

### Local Backup (React Native)

`lib/backup.ts` exposes three functions used in the Settings screen:

- `createLocalBackup()` — exports JSON and shares it via `expo-sharing`
- `saveBackupToDownloads()` — writes backup to Downloads (Android) or Documents (iOS) using `expo-file-system`
- `restoreFromBackup()` — opens a JSON file picker via `expo-document-picker` and restores data

### Key Conventions (React Native)

#### Theming

```tsx
const scheme = useAppColorScheme() // ColorSchemeName ('light' | 'dark' | null)
const colors = getColors(scheme) // full palette from lib/theme.ts
```

- `useAppColorScheme()` reads `settings.themePreference` and falls back to `useColorScheme()` from react-native.
- Use `spacing`, `typography`, and `radius` from `lib/theme.ts` — never hardcode pixel values.
- `typography` values use **numeric** `lineHeight` (e.g. `40`) — React Native style.
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
- `collection/add.tsx` accepts `?edit=<id>` and `?parentId=<id>` search params for edit and sub-collection creation.

#### Components

- Define a typed `interface Props` for every component.
- Use `SafeAreaView` from `react-native-safe-area-context` (not RN core) for root screen containers.
- Use `TouchableOpacity` with `activeOpacity={0.75}` for pressable items.
- Prefer `expo-image` for remote images in new components.
- `SearchBar.tsx` exports `SearchBar`, `FilterChip` (toggle chip), and `FilterRow` (horizontal scroll wrapper).
- `ContextMenu` props: `actions: MenuAction[]` (each: `{ label, icon, onPress, destructive? }`), `iconSize?`, `iconColor?`.
- `FAB` props: `onPress`, `visible?` (animates in/out via Reanimated spring), `icon?` (Ionicons name, default `'add'`).
- `EmptyState` props: `icon` (Ionicons name), `title`, `subtitle?`.

#### Home & Collection Detail Layout

- Bookmarks render as a **masonry grid** using `BookmarkMasonryCard`.
- Column count: 2 (default), 3 (≥ 600 px), 4 (≥ 900 px) — use `useWindowDimensions()`.
- Collection detail (`collection/[id].tsx`) includes bookmarks from the collection **and its direct child collections**.

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
    index.css            # Global resets, .page-scroll, desktop phone-frame styles
    components/
      TabLayout.tsx      # Bottom tab bar (Home/Search/Collections/Settings) + <Outlet>
      BookmarkCard.tsx   # Card with cover image, tags, collection badge, hover shadow
      CollectionCard.tsx
      ContextMenu.tsx
      EmptyState.tsx
      FAB.tsx
      ModalPage.tsx      # Full-screen modal — title, X close, optional save button
      SearchBar.tsx
    hooks/
      use-app-color-scheme.ts  # Reads settings + window.matchMedia; returns 'light' | 'dark'
      use-background-sync.ts   # Syncs on mount + document.visibilitychange
    lib/
      api.ts             # Same API wrapper as the RN app (fetch-based)
      auth-context.tsx   # AuthProvider + useAuth() — synchronous localStorage variant
      auth-storage.ts    # localStorage helpers — all synchronous, no async/await
      context.tsx        # BookmarksProvider + useBookmarks() — identical shape to RN; loads synchronously
      storage.ts         # Synchronous localStorage r/w; keys prefixed pb_; exportAllData / importAllData
      sync.ts            # mergeData, uploadData, fetchAndMerge, fetchLatestBackup, getLastSyncTime, uploadBackup
      theme.ts           # getColors(), spacing, typography (px string lineHeight), radius, COLLECTION_*, TAG_COLORS
      types.ts           # Bookmark, Collection, AppSettings, UrlMetadata, StoredUser
      utils.ts           # generateId, extractDomain, normalizeUrl, getFaviconUrl, fetchUrlMetadata, searchFilter, formatDate
    pages/
      HomePage.tsx           # Masonry bookmark grid with search + filter chips
      SearchPage.tsx
      CollectionsPage.tsx
      CollectionDetailPage.tsx   # Shows collection + child collections' bookmarks; renders Lucide icon via ICON_MAP
      SettingsPage.tsx           # Theme picker, local backup export/import, cloud sync, sign-in/out
      AddBookmarkPage.tsx        # Accepts ?url= param; auto-fetches metadata on load
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
- `lib/sync.ts` exports: `mergeData`, `uploadData`, `fetchAndMerge`, `fetchLatestBackup`, `getLastSyncTime`, `uploadBackup`.
- `uploadBackup()` reads current localStorage data and uploads it, saving a `LAST_SYNC_TIME` key.
- `getLastSyncTime()` returns timestamp (ms) of last successful upload or `null`.

### Layout & Viewport (PWA)

- `#root` is constrained to `max-width: 768px`, centered, `height: 100dvh`.
- On viewports ≥ 768 px, `body` shows a dark background (`#1a1a2e`) and root gets a phone-frame shadow/border-radius — simulates a phone on desktop.
- Scrollable areas use `className='page-scroll'` (flex: 1, overflow-y: auto, overscroll-behavior: contain).

### Routing (PWA)

```tsx
// Tab screens wrapped by TabLayout (renders <Outlet> + bottom tab bar)
/home, /search, /collections, /settings

// Full-screen modal pages (rendered outside TabLayout)
/bookmark/add?url=..., /bookmark/:id
/collection/add, /collection/:id

// Auth pages
/auth/login, /auth/register, /auth/otp
```

### Theming (PWA)

```tsx
const scheme = useAppColorScheme() // 'light' | 'dark'
const colors = getColors(scheme) // AppColors from pwa/src/lib/theme.ts
```

- `typography` values use CSS `lineHeight` **strings** (e.g. `'24px'`), unlike the RN app which uses numeric values.
- Pass `colors` as a prop to components; do not import theme globals directly.
- Use `ModalPage` for full-screen add/edit screens — props: `title`, `onClose`, `onSave?`, `saveLabel?`, `saveDisabled?`, `children`, `colors`.

### PWA Component Conventions

- All styling via inline `style` objects using `colors.*`, `spacing.*`, `radius.*`.
- `WebkitTapHighlightColor: 'transparent'` on interactive elements.
- Use `lucide-react` icons — import named components (e.g. `import { X, Pencil } from 'lucide-react'`).
- Scrollable content areas use `className='page-scroll'` (defined in `index.css`).
- No `SafeAreaView` — use `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` where needed (e.g. tab bar).
- Collection icons in the PWA are Lucide names mapped via `ICON_MAP` (e.g. `'code-2'` → `Code2` component). See `CollectionDetailPage.tsx` for the mapping pattern.

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
  parentId?: string // supports one level of nesting
  color: string // hex from COLLECTION_COLORS
  icon: string // icon slug from COLLECTION_ICONS
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

### Utility Functions (`lib/utils.ts` — both apps)

```ts
generateId()                           // 'timestamp_randomBase36'
extractDomain(url)                     // strips 'www.', returns hostname
normalizeUrl(url)                      // prepends 'https://' if missing
getFaviconUrl(url)                     // Google S2 favicon service URL
fetchUrlMetadata(url): UrlMetadata     // fetches + parses OG/Twitter meta tags
searchFilter(query, ...fields)         // case-insensitive substring match across fields
formatDate(timestamp)                  // locale-aware short date string
```

### Storage Keys

Both apps use the same key prefix `pb_` for localStorage/AsyncStorage: `pb_bookmarks`, `pb_collections`, `pb_settings`.

### New Entities

- Generate IDs with `generateId()` from `lib/utils.ts`.
- Timestamps use `Date.now()` (Unix ms).

### Collection Colors & Icons

- Pick colors from `COLLECTION_COLORS` and icons from `COLLECTION_ICONS` (both in `lib/theme.ts`).
- RN: icons are Ionicons slugs (e.g. `'code-slash'`, `'musical-notes'`, `'game-controller'`).
- PWA: icons are Lucide slugs (e.g. `'code-2'`, `'music'`, `'gamepad-2'`) — see `ICON_MAP` in `CollectionDetailPage.tsx`.

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
