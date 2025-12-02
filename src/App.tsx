import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/mobile/BottomNav';
import { FAB } from './components/mobile/FAB';
import { BottomSheet } from './components/mobile/BottomSheet';
import { InstallPrompt } from './components/InstallPrompt';
import { useBottomSheet } from './hooks/useBottomSheet';
import { useCollections } from './hooks/useCollections';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import * as db from './lib/db';

// Pages
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import RecycleBinPage from './pages/RecycleBinPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ShareTargetPage from './pages/ShareTargetPage';
import AddBookmarkSheet from './components/bookmarks/AddBookmarkSheet';

function App() {
  const addBookmarkSheet = useBottomSheet();
  const { cleanupDuplicates } = useCollections();

  // Cleanup duplicate collections and old deleted items on app start
  useEffect(() => {
    cleanupDuplicates();
    // Run cleanup of old deleted items (older than 7 days)
    db.cleanupOldDeletedItems().catch(console.error);
  }, []);

  const { user, loading, syncing } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  // Show syncing indicator after login
  if (user && syncing) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <div className="text-center">
          <p className="text-lg font-medium">Syncing your bookmarks...</p>
          <p className="text-secondary-foreground mt-2 line-clamp-1 text-sm text-ellipsis">
            This will just take a moment
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth routes
  if (!user) {
    return (
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    );
  }

  // If authenticated but email not verified, show verify email page
  if (user && !user.email_confirmed_at) {
    return (
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<Navigate to="/verify-email" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main app
  return (
    <>
      {/* Main Content */}
      <main className="bg-background h-[calc(100dvh-65px)]">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <CollectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:collectionId"
            element={
              <ProtectedRoute>
                <CollectionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recycle-bin"
            element={
              <ProtectedRoute>
                <RecycleBinPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/share"
            element={
              <ProtectedRoute>
                <ShareTargetPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Floating Action Button */}
      <FAB onClick={addBookmarkSheet.open} label="Add Bookmark" />

      {/* Add Bookmark Bottom Sheet */}
      <BottomSheet
        isOpen={addBookmarkSheet.isOpen}
        onClose={addBookmarkSheet.close}
        title="Add Bookmark"
      >
        <AddBookmarkSheet onClose={addBookmarkSheet.close} />
      </BottomSheet>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </>
  );
}

export default App;
