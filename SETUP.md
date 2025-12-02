# 🗄️ Supabase Setup Guide

Complete guide to setting up Supabase backend for the Bookmark Manager PWA.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Bookmark Manager PWA project cloned locally
- Basic understanding of SQL (helpful but not required)

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `bookmark-manager` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
   - **Plan**: Free tier is perfect for getting started
4. Click **"Create new project"**
5. Wait 2-3 minutes for Supabase to provision your project

### Step 2: Get Your API Credentials

1. In your project dashboard, click **Settings** (⚙️ icon in sidebar)
2. Click **API** in the left menu
3. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 3: Configure Your App

1. In your project root, create a `.env` file:

   ```bash
   touch .env
   ```

2. Add your credentials to `.env`:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Save the file** (it's already in `.gitignore`, so it won't be committed)

### Step 4: Run Database Setup Script

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` in your project
4. Copy the **entire contents** of that file
5. Paste into the SQL Editor
6. Click **"Run"** (or press `Cmd/Ctrl + Enter`)
7. You should see: ✅ **"Success. No rows returned"**

### Step 5: Verify Setup

1. In Supabase dashboard, go to **Table Editor** (left sidebar)
2. You should see two tables:
   - ✅ `bookmarks`
   - ✅ `collections`
3. Click on each table to verify the columns are created

### Step 6: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. For production, consider enabling **"Confirm email"** under Email settings

### Step 7: Test Your Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173` in your browser
3. Click **"Sign Up"** and create a test account
4. Try adding a collection and a bookmark
5. Go back to Supabase **Table Editor** → `bookmarks` → you should see your bookmark!

---

## 📊 Database Schema Overview

### Tables

#### `collections` Table

Stores user-created bookmark folders/collections.

| Column             | Type        | Description                                            |
| ------------------ | ----------- | ------------------------------------------------------ |
| `id`               | TEXT        | Primary key (UUID as text)                             |
| `user_id`          | UUID        | References `auth.users`, user who owns this collection |
| `name`             | TEXT        | Collection name (e.g., "Work", "Personal")             |
| `description`      | TEXT        | Optional description                                   |
| `color`            | TEXT        | Hex color for UI (default: `#6366f1`)                  |
| `icon`             | TEXT        | Icon name for UI (default: `folder`)                   |
| `order`            | INTEGER     | Sort order (default: 0)                                |
| `created_at`       | TIMESTAMPTZ | When collection was created                            |
| `last_modified_at` | TIMESTAMPTZ | When collection was last updated                       |
| `is_deleted`       | BOOLEAN     | Soft delete flag (recycle bin)                         |
| `deleted_at`       | TIMESTAMPTZ | When collection was deleted                            |

#### `bookmarks` Table

Stores user bookmarks with metadata.

| Column             | Type        | Description                                          |
| ------------------ | ----------- | ---------------------------------------------------- |
| `id`               | TEXT        | Primary key (UUID as text)                           |
| `user_id`          | UUID        | References `auth.users`, user who owns this bookmark |
| `url`              | TEXT        | Bookmark URL                                         |
| `title`            | TEXT        | Bookmark title                                       |
| `description`      | TEXT        | Optional description                                 |
| `collection_id`    | TEXT        | References `collections.id` (nullable)               |
| `favicon`          | TEXT        | Favicon URL or data URI                              |
| `created_at`       | TIMESTAMPTZ | When bookmark was created                            |
| `last_modified_at` | TIMESTAMPTZ | When bookmark was last updated                       |
| `is_deleted`       | BOOLEAN     | Soft delete flag (recycle bin)                       |
| `deleted_at`       | TIMESTAMPTZ | When bookmark was deleted                            |

### Features

#### 🔐 Row Level Security (RLS)

Every table has RLS enabled with policies that ensure:

- ✅ Users can only view their own data
- ✅ Users can only create data for themselves
- ✅ Users can only update their own data
- ✅ Users can only delete their own data
- ✅ Complete data isolation between users

#### 🗑️ Soft Delete (Recycle Bin)

- Deleted items are marked with `is_deleted = true` and `deleted_at` timestamp
- Items stay in recycle bin for 7 days
- Users can restore items during this period
- After 7 days, items are permanently deleted by the cleanup function

#### 🔄 Sync Support

- `last_modified_at` timestamp enables conflict resolution
- Newest modification wins in case of conflicts
- Works with offline-first IndexedDB storage

---

## 🔐 Authentication Setup

### Email/Password (Default)

Email authentication is enabled by default. Your app supports:

- Sign up with email/password
- Sign in with email/password
- Password reset via email

### Optional: Enable Email Confirmation

For production, enable email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to ON
3. Users will receive a confirmation email after signup
4. Customize email templates in **Authentication** → **Email Templates**

### Optional: Add OAuth Providers

To add Google, GitHub, or other OAuth:

1. Go to **Authentication** → **Providers**
2. Enable your desired provider (e.g., **Google**)
3. Follow Supabase's provider-specific setup guide
4. Add OAuth credentials from the provider
5. Update your app code to include OAuth sign-in buttons

---

## 🧹 Automatic Cleanup (Optional)

The database includes a `cleanup_old_deleted_items()` function that permanently deletes items after 7 days in the recycle bin.

### Option 1: Manual Cleanup

Call the function manually in SQL Editor whenever needed:

```sql
SELECT public.cleanup_old_deleted_items();
```

### Option 2: Scheduled Cleanup with pg_cron

Set up automatic daily cleanup:

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Enable the **pg_cron** extension
3. In **SQL Editor**, run:
   ```sql
   SELECT cron.schedule(
       'cleanup-recycle-bin',
       '0 2 * * *',  -- Run at 2 AM daily
       $$SELECT public.cleanup_old_deleted_items()$$
   );
   ```
4. Verify the cron job is scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```

---

## 🌐 Production Configuration

### URL Configuration

When deploying to production (e.g., GitHub Pages):

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://yourusername.github.io/bookmark/
   ```
3. Add to **Redirect URLs**:
   ```
   https://yourusername.github.io/bookmark/**
   ```

### Security Best Practices

- ✅ **Never commit `.env`** to Git (already in `.gitignore`)
- ✅ **anon key is safe** to use in client-side code
- ✅ **RLS is enabled** - database enforces user isolation
- ✅ **Use HTTPS** in production for secure connections
- ✅ **Keep dependencies updated** for security patches

---

## 📈 Supabase Free Tier Limits

The free tier includes:

- ✅ 500 MB database space
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Social OAuth providers

Perfect for personal use and small projects!

---

## 🛠️ Troubleshooting

### Database Setup Issues

**Problem**: SQL script returns errors

**Solutions**:

- Make sure you're running the entire `supabase/schema.sql` file
- Check that no tables already exist (script uses `IF NOT EXISTS`)
- Verify you have the correct permissions in Supabase

**Problem**: Tables don't appear in Table Editor

**Solutions**:

- Refresh the page
- Check the SQL Editor for error messages
- Verify the script completed successfully

### Authentication Issues

**Problem**: Can't sign up or sign in

**Solutions**:

- Verify `.env` file has correct credentials
- Restart dev server after changing `.env`
- Check Supabase **Authentication** → **Users** to see if user was created
- Check browser console for error messages

**Problem**: "Invalid API key" error

**Solutions**:

- Double-check you copied the **anon public** key, not the service role key
- Ensure no extra spaces or characters in `.env` file
- Restart dev server after updating `.env`

### Data Access Issues

**Problem**: Can't see bookmarks or collections

**Solutions**:

- Verify RLS policies are enabled (check **Authentication** → **Policies**)
- Ensure you're logged in with the correct user
- Check browser console for permission errors
- Verify `user_id` matches `auth.uid()` in database

### Connection Issues

**Problem**: "Failed to fetch" or connection errors

**Solutions**:

- Check your internet connection
- Verify Supabase project URL is correct in `.env`
- Check Supabase project status (outages are rare)
- Ensure no firewall/VPN is blocking Supabase

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Next Steps

After completing this setup:

1. **Test the authentication flow** - Sign up, sign in, sign out
2. **Create bookmarks and collections** - Verify data is saved
3. **Test the recycle bin** - Delete and restore items
4. **Set up OAuth** (optional) - Add Google or GitHub login
5. **Deploy to production** - Configure production URLs
6. **Monitor usage** - Check Supabase dashboard for stats

---

**Need help?** Check the troubleshooting section or open an issue on GitHub!
