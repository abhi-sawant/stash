-- ================================================
-- Bookmark Manager PWA - Complete Database Setup
-- ================================================
-- This script creates the complete database schema for the Bookmark Manager PWA
-- Run this script in your Supabase SQL Editor to set up the database
--
-- Features:
-- - User-isolated bookmarks and collections
-- - Soft delete (recycle bin) with 7-day retention
-- - Row Level Security (RLS) for data protection
-- - Automatic cleanup of old deleted items
--
-- Tables: bookmarks, collections
-- Functions: cleanup_old_deleted_items
-- ================================================

-- ================================================
-- COLLECTIONS TABLE
-- ================================================
-- Stores user-created bookmark collections/folders
CREATE TABLE IF NOT EXISTS public.collections (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'folder',
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- ================================================
-- BOOKMARKS TABLE
-- ================================================
-- Stores user bookmarks with metadata and organization
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
    favicon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
-- Indexes for soft-deleted items (recycle bin queries)
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_deleted 
    ON public.bookmarks(is_deleted, deleted_at) 
    WHERE is_deleted = true;

CREATE INDEX IF NOT EXISTS idx_collections_is_deleted 
    ON public.collections(is_deleted, deleted_at) 
    WHERE is_deleted = true;

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES FOR BOOKMARKS
-- ================================================
-- Users can view their own active bookmarks (not deleted)
CREATE POLICY "Users can view their own active bookmarks"
    ON public.bookmarks
    FOR SELECT
    USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

-- Users can view their own deleted bookmarks (recycle bin)
CREATE POLICY "Users can view their own deleted bookmarks"
    ON public.bookmarks
    FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = true);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
    ON public.bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
    ON public.bookmarks
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- RLS POLICIES FOR COLLECTIONS
-- ================================================
-- Users can view their own active collections (not deleted)
CREATE POLICY "Users can view their own active collections"
    ON public.collections
    FOR SELECT
    USING (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL));

-- Users can view their own deleted collections (recycle bin)
CREATE POLICY "Users can view their own deleted collections"
    ON public.collections
    FOR SELECT
    USING (auth.uid() = user_id AND is_deleted = true);

-- Users can insert their own collections
CREATE POLICY "Users can insert their own collections"
    ON public.collections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update their own collections"
    ON public.collections
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete their own collections"
    ON public.collections
    FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- FUNCTION: CLEANUP OLD DELETED ITEMS
-- ================================================
-- Automatically deletes items that have been in recycle bin for more than 7 days
-- This function should be called periodically (e.g., daily via pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete bookmarks that have been soft-deleted for more than 7 days
    DELETE FROM public.bookmarks
    WHERE is_deleted = true
    AND deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '7 days';

    -- Delete collections that have been soft-deleted for more than 7 days
    DELETE FROM public.collections
    WHERE is_deleted = true
    AND deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ================================================
-- SCHEDULE AUTOMATIC CLEANUP (OPTIONAL)
-- ================================================
-- Uncomment the following to automatically run cleanup daily at 2 AM
-- Requires pg_cron extension to be enabled in Supabase
--
-- SELECT cron.schedule(
--     'cleanup-recycle-bin',
--     '0 2 * * *',
--     $$SELECT public.cleanup_old_deleted_items()$$
-- );

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================
COMMENT ON TABLE public.bookmarks IS 'Stores user bookmarks with metadata and organization';
COMMENT ON TABLE public.collections IS 'Stores user-created bookmark collections/folders';
COMMENT ON COLUMN public.bookmarks.user_id IS 'References auth.users table, ensures user isolation';
COMMENT ON COLUMN public.bookmarks.collection_id IS 'Optional reference to collections table for organization';
COMMENT ON COLUMN public.bookmarks.last_modified_at IS 'Used for sync conflict resolution (newest wins)';
COMMENT ON COLUMN public.bookmarks.is_deleted IS 'Soft delete flag - true if item is in recycle bin';
COMMENT ON COLUMN public.bookmarks.deleted_at IS 'Timestamp when item was moved to recycle bin';
COMMENT ON COLUMN public.collections.last_modified_at IS 'Used for sync conflict resolution (newest wins)';
COMMENT ON COLUMN public.collections.is_deleted IS 'Soft delete flag - true if item is in recycle bin';
COMMENT ON COLUMN public.collections.deleted_at IS 'Timestamp when item was moved to recycle bin';
COMMENT ON FUNCTION public.cleanup_old_deleted_items IS 'Deletes items that have been in recycle bin for more than 7 days';

-- ================================================
-- SETUP COMPLETE!
-- ================================================
-- Your database is now ready to use.
-- Next steps:
-- 1. Configure your .env file with Supabase credentials
-- 2. Enable email authentication in Supabase Dashboard
-- 3. (Optional) Set up pg_cron for automatic cleanup
-- 4. Start your development server and test!
