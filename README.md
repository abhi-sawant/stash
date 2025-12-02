# 📚 Bookmark Manager PWA

A mobile-first Progressive Web App for managing bookmarks with offline support and cloud sync, built with React, TypeScript, Tailwind CSS, and Supabase.

🔗 **Live Demo:** [https://abhi-simform.github.io/bookmark/](https://abhi-simform.github.io/bookmark/)

> A complete, production-ready bookmark manager with offline-first architecture, cloud synchronization, and installable PWA capabilities.

## 🚀 Features

### Core Features

- ✅ **Mobile-First Design** - Optimized for touch interactions on phones and tablets
- ✅ **PWA Support** - Install on your device and use offline with service workers
- ✅ **Cloud Sync** - Automatic bidirectional sync with Supabase
- ✅ **Offline-First** - Works completely offline with IndexedDB storage
- ✅ **Authentication** - Secure user authentication with Supabase Auth
- ✅ **Collections** - Organize bookmarks into folders with full CRUD operations
- ✅ **Export/Import Collections** - Export and import individual collections as JSON
- ✅ **Recycle Bin** - Soft delete with 7-day recovery period before permanent deletion
- ✅ **Smart Install Prompts** - Browser and device-specific installation instructions
- ✅ **Auto Metadata Fetching** - Automatically fetch title, description, favicon, and thumbnails from URLs using Microlink API
- ✅ **Background Thumbnail Fetching** - Thumbnails are fetched in the background without blocking UI
- ✅ **Import/Export** - Export bookmarks to JSON or import from backup files

### Mobile UI Features

- ✅ **Bottom Navigation** - Easy thumb-reach navigation
- ✅ **Floating Action Button** - Quick access to add bookmarks
- ✅ **Bottom Sheets** - Native-like modal dialogs
- ✅ **Pull-to-Refresh** - Natural refresh interaction
- ✅ **Haptic Feedback** - Vibration feedback on interactions
- ✅ **Touch-Friendly** - All buttons meet 44px minimum tap target size
- ✅ **Safe Area Support** - Proper handling of notched devices
- ✅ **Web Share Target** - Receive shared links from other apps (appears in system share menu)
- ✅ **Native App-Like Navigation** - Hierarchical back button behavior with exit confirmation
- ✅ **Dark Mode Support** - System-aware theme with manual toggle

## 📱 Mobile-First Features

### Touch Interactions

- **Pull-to-Refresh** - Refresh bookmark list
- **Haptic Feedback** - Vibration feedback on interactions (light, medium, heavy)
- **Touch Gestures** - Responsive touch interactions throughout the UI

### Mobile UI Components

- **Bottom Navigation** - Primary navigation at thumb-level
- **Floating Action Button (FAB)** - Quick add bookmark
- **Bottom Sheets** - Native-like modal sheets
- **Pull-to-Refresh** - Natural refresh gesture
- **Confirm Dialogs** - Touch-friendly confirmation modals
- **Touch-Friendly Forms** - Large inputs and buttons

### 🔙 Native App-Like Navigation

The app implements a hierarchical navigation system that mimics native mobile apps, preventing users from jumping through browser history:

**Navigation Hierarchy:**

```
Home Page (Exit confirmation on back)
├── Collections Page → Back to Home
│   └── Collection Detail → Back to Collections
├── Search Page → Back to Home
├── Profile Page → Back to Home
└── Recycle Bin → Back to Home
```

**Key Features:**

- **Predictable Back Behavior** - Back button always navigates to the parent page in hierarchy
- **Exit Confirmation** - When on home page, back button shows a confirmation dialog before exiting
- **No History Jumping** - Eliminates confusing browser history behavior
- **Clean Exit Path** - Users navigate back through app structure before reaching exit

This creates a native mobile app experience where navigation is intuitive and users always know where the back button will take them.

### 📤 Web Share Target (Share to App)

The PWA integrates with your device's native share menu! When you share a link from any app (browser, Twitter, etc.), **Bookmark Manager** will appear as a share target.

**How to use:**

1. Install the PWA on your device (see installation instructions below)
2. Find a link you want to bookmark in any app (browser, social media, etc.)
3. Tap the **Share** button
4. Select **Bookmark Manager** from the share sheet
5. The app opens with the URL pre-filled - edit title/description and save!

**Supported share data:**

- URL (required) - The link to bookmark
- Title (optional) - Pre-fills the bookmark title
- Text (optional) - Pre-fills the description

**Note:** The Web Share Target API requires the PWA to be installed on your device. It won't appear in the share menu when accessing via browser.

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library with hooks
- **TypeScript** - Type safety and better DX
- **Vite 7** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first CSS framework (new architecture)
- **shadcn/ui** - High-quality UI components
- **React Router DOM 7** - Client-side routing with GitHub Pages support
- **Lucide React** - Beautiful icon library

### Backend & Storage

- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Real-time)
- **IndexedDB** - Local offline storage (using idb wrapper library)
- **Supabase Auth** - User authentication and authorization
- **Row Level Security (RLS)** - Database security per user

### PWA & Performance

- **vite-plugin-pwa** - PWA configuration and service worker generation
- **Workbox** - Service worker strategies and caching
- **Auto-update Service Worker** - Seamless app updates
- **Background Sync** - Automatic cloud synchronization

## 📦 Complete Setup Guide

This guide will walk you through setting up your own instance of the Bookmark Manager PWA from scratch.

### Prerequisites

- **Node.js 18+** and npm installed
- **Git** installed
- A **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- A **GitHub account** (for deployment)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/abhi-simform/bookmark.git
cd bookmark
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including React, TypeScript, Vite, Tailwind CSS, Supabase client, and PWA tools.

---

### Step 3: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `bookmark-manager` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your location
   - **Pricing Plan**: Free tier is sufficient
4. Click **"Create new project"** and wait 2-3 minutes for setup

---

### Step 4: Set Up Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` in your project
4. Copy the **entire contents** of the file
5. Paste into the SQL Editor
6. Click **"Run"** or press `Ctrl/Cmd + Enter`
7. You should see: ✅ **"Success. No rows returned"**

**What this does:**

- Creates `bookmarks` and `collections` tables
- Sets up Row Level Security (RLS) policies for user data isolation
- Creates indexes for performance
- Adds soft delete support (recycle bin)
- Creates `cleanup_old_deleted_items()` function for automatic 7-day cleanup

---

### Step 5: Configure Environment Variables

1. In Supabase, go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

3. Create a `.env` file in the project root:

```bash
# In the bookmark directory
touch .env
```

4. Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit the `.env` file to Git (it's already in `.gitignore`)

---

### Step 6: Test Locally

1. Start the development server:

```bash
npm run dev
```

2. Open your browser to `http://localhost:5173`

3. **Test the application:**
   - Click **"Sign Up"** and create an account
   - Add some test bookmarks
   - Create collections
   - Test the search functionality
   - Verify data syncs to Supabase (check in Supabase Dashboard → Table Editor)

---

### Step 7: Deploy to GitHub Pages

#### 7.1 Update Configuration for Your Repository

1. Open `vite.config.ts`
2. Update the `base` path to match your repository name:

```typescript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
  // ... rest of config
});
```

3. Open `src/main.tsx`
4. Update the `basename`:

```typescript
const basename = import.meta.env.MODE === 'production' ? '/your-repo-name' : '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      {/* ... */}
    </BrowserRouter>
  </React.StrictMode>
);
```

5. Update the `share_target` action in `vite.config.ts` PWA manifest:

```typescript
share_target: {
  action: process.env.NODE_ENV === 'production' ? '/your-repo-name/share' : '/share',
  // ... rest of config
}
```

**Example:** If your repo is `https://github.com/username/my-bookmarks`, replace `/your-repo-name/` with `/my-bookmarks/`

#### 7.2 Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it (e.g., `bookmark-manager`)
3. Keep it **public** (required for free GitHub Pages)
4. **Don't** initialize with README (you already have one)

#### 7.3 Push Your Code

```bash
# Initialize git (if not already done)
git init

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/your-username/your-repo-name.git

# Add and commit files
git add .
git commit -m "Initial commit: Bookmark Manager PWA"

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 7.4 Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:

- Build the production version
- Create a `gh-pages` branch
- Deploy your app to GitHub Pages

#### 7.5 Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**

Wait 2-3 minutes, then your app will be live at:
`https://your-username.github.io/your-repo-name/`

---

### Step 8: Configure Supabase for Production

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your GitHub Pages URL to **Site URL**:
   ```
   https://your-username.github.io/your-repo-name/
   ```
3. Add the same URL to **Redirect URLs**

---

## 🔄 Updating Your Deployment

When you make changes and want to deploy:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push origin main

# Deploy to GitHub Pages
npm run deploy
```

---

## 🗄️ Database Schema

The app uses two main tables:

### **bookmarks** table

```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**

- `id` - Unique bookmark identifier
- `user_id` - Links to authenticated user (auto-deleted when user deleted)
- `url` - The bookmark URL
- `title` - Display title
- `description` - Optional description
- `favicon` - Site favicon URL
- `collection_id` - Which collection this belongs to (null if uncategorized)
- `is_deleted` - Soft delete flag (true if in recycle bin)
- `deleted_at` - Timestamp when moved to recycle bin
- `created_at` - Creation timestamp
- `last_modified_at` - Last update timestamp

### **collections** table

```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  "order" INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**

- `id` - Unique collection identifier
- `user_id` - Links to authenticated user
- `name` - Collection name
- `description` - Optional description
- `icon` - Icon name (from Lucide icons)
- `color` - Hex color code
- `order` - Display order
- `is_deleted` - Soft delete flag (true if in recycle bin)
- `deleted_at` - Timestamp when moved to recycle bin
- `created_at` - Creation timestamp
- `last_modified_at` - Last update timestamp

### **Row Level Security (RLS)**

Every table has RLS enabled with policies that ensure:

- Users can only see their own data
- Users can only modify their own data
- Data is automatically isolated by user ID
- Soft-deleted items are handled with separate policies

### **Automatic Features**

- **Auto-Cleanup**: The `cleanup_old_deleted_items()` function can permanently delete items in recycle bin for 7+ days
- **Conflict Resolution**: Uses "newest wins" strategy based on `last_modified_at` timestamp

See `supabase/schema.sql` for the complete schema with all indexes, RLS policies, and functions.

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**.

---

## 📱 Available Scripts

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173

# Build
npm run build        # Build for production
npm run build:check  # Type check and build for production
npm run preview      # Preview production build locally

# Deployment
npm run deploy       # Build and deploy to GitHub Pages

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

---

## 🌐 PWA Installation

The app includes smart installation prompts that automatically detect your device and browser to show appropriate instructions.

### iOS (Safari)

1. Open the app in Safari
2. Tap the Share button (⎙) at the bottom
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)

1. Open the app in Chrome
2. Tap the menu (⋮) at the top right
3. Tap "Add to Home screen" or "Install app"
4. Tap "Install"

### Android (Samsung Internet)

1. Open the app
2. Tap the menu (⋮) at the bottom
3. Tap "Add page to"
4. Select "Home screen"

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the install icon (⊕) in the address bar
3. Click "Install"

**Note:** The app shows an installation prompt 2 seconds after you sign in, with specific instructions for your device and browser!

## 📐 Mobile-First Design Principles

### Breakpoints

```css
/* Mobile (default): < 640px */
/* Tablet: 640px - 1023px */
/* Desktop: 1024px+ */
```

### Touch Targets

- Minimum size: 44x44px (iOS) / 48x48px (Android)
- Adequate spacing: 8px between interactive elements

### Typography

- Base font size: 16px (prevents mobile zoom)
- Line height: 1.5 for readability

### Performance

- Optimized images with lazy loading
- Code splitting for faster initial load
- Virtual scrolling for large lists
- Service worker caching

## 🎨 Customization

### Theme Colors

The app includes built-in dark mode support. Customize theme colors by editing CSS variables in `src/index.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... more colors */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... dark mode colors */
}
```

**Theme Options:**

- **Light Mode** - Clean, bright interface
- **Dark Mode** - Eye-friendly dark interface
- **System** - Automatically follows OS theme preference (default)

Change theme from Profile page → Theme Settings

### Safe Area Support

The app automatically handles notched devices (iPhone X+) using CSS environment variables:

- `pb-safe-bottom` - Adds padding for home indicator
- `pt-safe-top` - Adds padding for status bar

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── auth/            # Authentication components
│   ├── bookmarks/       # Bookmark CRUD components
│   ├── collections/     # Collection management
│   ├── mobile/          # Mobile-specific UI components
│   ├── ui/              # shadcn/ui components
│   └── InstallPrompt.tsx # PWA installation prompt
├── contexts/
│   ├── AuthContext.tsx  # Authentication state management
│   ├── BookmarksContext.tsx # Bookmarks state management
│   └── ThemeContext.tsx # Dark/light theme state
├── hooks/               # Custom React hooks
│   ├── useBookmarks.ts  # Bookmark operations
│   ├── useBottomSheet.ts # Bottom sheet state
│   ├── useCollections.ts # Collection operations
│   └── useInstallPrompt.ts # PWA install detection
├── lib/
│   ├── db.ts           # IndexedDB wrapper
│   ├── supabase.ts     # Supabase client configuration
│   ├── sync.ts         # Cloud synchronization logic
│   ├── metadata.ts     # URL metadata fetching
│   ├── thumbnailService.ts # Background thumbnail service
│   ├── haptics.ts      # Haptic feedback helpers
│   ├── utils.ts        # Utility functions
│   └── database.types.ts # Supabase TypeScript types
├── pages/              # Page components
│   ├── HomePage.tsx    # Main bookmarks view
│   ├── CollectionsPage.tsx # Collections overview
│   ├── CollectionDetailPage.tsx # Single collection view
│   ├── SearchPage.tsx  # Search functionality
│   ├── ProfilePage.tsx # User profile and settings
│   ├── RecycleBinPage.tsx # Deleted items view
│   ├── ShareTargetPage.tsx # Web Share Target handler
│   ├── SignInPage.tsx  # Authentication
│   └── SignUpPage.tsx  # Registration
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── index.css           # Global styles
```

### Key Files

- `vite.config.ts` - Vite and PWA configuration with GitHub Pages support
- `tailwind.config.js` - Tailwind CSS 4 configuration (minimal)
- `postcss.config.js` - PostCSS configuration with Tailwind 4 plugin
- `supabase/schema.sql` - Complete database schema setup
- `SETUP.md` - Comprehensive Supabase setup guide
- `src/lib/db.ts` - IndexedDB database wrapper for offline storage
- `src/lib/sync.ts` - Bidirectional sync between IndexedDB and Supabase
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/metadata.ts` - URL metadata fetching (Microlink API)
- `src/lib/thumbnailService.ts` - Background thumbnail fetching service
- `src/contexts/AuthContext.tsx` - Authentication and session management
- `src/contexts/BookmarksContext.tsx` - Bookmarks state management
- `src/contexts/ThemeContext.tsx` - Dark/light theme management
- `src/lib/database.types.ts` - TypeScript types for Supabase database
- PWA manifest is auto-generated by vite-plugin-pwa in the build output

## ✨ Key Features Explained

### Offline-First Architecture

- **IndexedDB** stores all data locally for instant access
- **Background Sync** automatically syncs with Supabase when online
- **Conflict Resolution** uses "newest wins" strategy for data conflicts
- **Works Completely Offline** - add, edit, delete bookmarks without internet

### Cloud Synchronization

- **Automatic Sync** on login and after CRUD operations
- **Bidirectional Sync** between local IndexedDB and Supabase
- **Initial Sync** fetches all cloud data on first login
- **Incremental Updates** only syncs changed data
- **Manual Sync Button** in profile page for force sync

### Smart PWA Installation

- **Auto-Detection** identifies user's device and browser
- **Custom Instructions** shows platform-specific installation steps
- **Install Prompt** appears 2 seconds after login
- **Manual Install Button** available in Profile page

### Background Services

- **Thumbnail Fetching** happens in background after login using ThumbnailService
- **Rate Limited** to 1 request per second to respect Microlink API limits
- **Fallback Icons** show globe icon or domain favicon immediately while thumbnails load
- **Non-Blocking** UI remains responsive during background tasks
- **Automatic Retries** for failed thumbnail fetches
- **Progress Tracking** shows completion status in console

## 📝 Roadmap

### Completed ✅

- [x] Supabase cloud sync with offline-first architecture
- [x] Email authentication with Supabase Auth
- [x] Export bookmarks (JSON format)
- [x] Import bookmarks from JSON backup
- [x] PWA installation with smart prompts
- [x] Background thumbnail fetching
- [x] GitHub Pages deployment
- [x] Recycle bin with 7-day auto-cleanup
- [x] Collection management with colors and icons
- [x] Web Share Target API integration (share from other apps)
- [x] Dark mode support with system theme detection
- [x] Haptic feedback for mobile interactions
- [x] Pull-to-refresh functionality
- [x] Search functionality

### Planned 🎯

- [ ] Full-text search across bookmark content
- [ ] Google OAuth authentication
- [ ] Import from browser bookmarks (HTML format)
- [ ] Bulk URL paste and parsing
- [ ] Chrome/Firefox browser extension
- [ ] Push notifications for sync conflicts
- [ ] Collaborative collections (share with others)
- [ ] Tags support for bookmarks
- [ ] Analytics dashboard (most visited, usage stats)
- [ ] Custom theme colors and accent customization
- [ ] Keyboard shortcuts for power users

## � Troubleshooting

### Issue: "Failed to fetch metadata"

**Solution:** The app uses the free Microlink API for fetching page metadata (title, description, favicon, thumbnails). If rate-limited or unavailable:

- The app will still work - just manually enter the title and description
- A fallback title (domain name) will be used
- Thumbnails are fetched in the background by the ThumbnailService and will appear when available
- The service processes bookmarks in batches of 3 with 1-second delays to respect API limits

### Issue: Bookmarks not syncing

**Solution:**

1. Check your internet connection
2. Verify Supabase credentials in `.env`
3. Check Supabase dashboard → Authentication → Users to confirm you're signed in
4. Try manual sync from Profile page

### Issue: "Service worker registration failed"

**Solution:**

- Service workers only work on `localhost` or `https://` domains
- On GitHub Pages, this should work automatically
- Clear browser cache and reload

### Issue: PWA install prompt not showing

**Solution:**

- Install prompt only shows on HTTPS (or localhost)
- Chrome requires the app to be visited multiple times
- iOS Safari requires manual installation (no automatic prompt)
- Use the manual "Install App" button in Profile page

### Issue: Database types out of sync

**Solution:** Regenerate database types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

### Issue: GitHub Pages shows 404

**Solution:**

1. Verify `base` in `vite.config.ts` matches your repo name
2. Verify `basename` in `src/main.tsx` matches
3. Ensure GitHub Pages is enabled for `gh-pages` branch
4. Wait 2-3 minutes for GitHub Pages to deploy

### Issue: "Auth session missing" on production

**Solution:**

1. Add your GitHub Pages URL to Supabase → Authentication → URL Configuration
2. Add to both "Site URL" and "Redirect URLs"
3. Format: `https://username.github.io/repo-name/`

---

## 🏗️ Project Structure

```
bookmark/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   ├── web-app-manifest-512x512.png
│   ├── site.webmanifest
│   └── 404.html
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   │   └── ProtectedRoute.tsx
│   │   ├── bookmarks/     # Bookmark CRUD components
│   │   │   ├── AddBookmarkSheet.tsx
│   │   │   ├── BookmarkCard.tsx
│   │   │   ├── BookmarkGrid.tsx
│   │   │   └── MoveToCollectionSheet.tsx
│   │   ├── collections/   # Collection management
│   │   │   ├── ColorPicker.tsx
│   │   │   └── IconPicker.tsx
│   │   ├── mobile/        # Mobile-specific UI components
│   │   │   ├── BottomNav.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── FAB.tsx
│   │   │   └── PullToRefresh.tsx
│   │   ├── ui/            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   │   └── InstallPrompt.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   ├── BookmarksContext.tsx   # Bookmarks state
│   │   └── ThemeContext.tsx       # Dark/light theme state
│   ├── hooks/             # Custom React hooks
│   │   ├── useBookmarks.ts
│   │   ├── useBottomSheet.ts
│   │   ├── useCollections.ts
│   │   └── useInstallPrompt.ts
│   ├── lib/
│   │   ├── db.ts          # IndexedDB wrapper
│   │   ├── supabase.ts    # Supabase client
│   │   ├── sync.ts        # Cloud sync logic
│   │   ├── metadata.ts    # URL metadata fetching (Microlink API)
│   │   ├── thumbnailService.ts # Background thumbnail fetcher
│   │   ├── haptics.ts     # Haptic feedback helpers
│   │   ├── utils.ts       # Utility functions
│   │   └── database.types.ts # Supabase TypeScript types
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── CollectionsPage.tsx
│   │   ├── CollectionDetailPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RecycleBinPage.tsx
│   │   ├── ShareTargetPage.tsx
│   │   ├── SignInPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── VerifyEmailPage.tsx
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # App entry point
│   ├── index.css          # Global styles with Tailwind
│   └── vite-env.d.ts      # Vite environment type definitions
├── supabase/
│   └── schema.sql         # Complete database schema setup
├── .env                   # Environment variables (create this)
├── .gitignore             # Git ignore file
├── SETUP.md               # Comprehensive Supabase setup guide
├── README.md              # This file
├── RECYCLE_BIN.md         # Recycle bin feature documentation
├── vite.config.ts         # Vite & PWA configuration
├── tailwind.config.js     # Tailwind CSS 4 configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
├── tsconfig.node.json     # TypeScript config for Node
├── components.json        # shadcn/ui configuration
└── package.json           # Dependencies and scripts
```

---

## 🔒 Security

- **Row Level Security (RLS)** enabled on all Supabase tables
- **User-specific data** - users can only access their own bookmarks and collections
- **Authentication** - secure email/password authentication with Supabase Auth
- **Secure authentication** - handled by Supabase Auth
- **Environment variables** - sensitive keys stored in environment variables

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend-as-a-service
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Lucide](https://lucide.dev/) for the comprehensive icon library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for lightning-fast development experience
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for seamless PWA integration

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 🌟 Show Your Support

If you find this project useful, please consider giving it a ⭐️ on GitHub!

---

**Made with ❤️ for mobile-first bookmark management**
