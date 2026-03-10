import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import TabLayout from './components/TabLayout'
import { useBackgroundSync } from './hooks/use-background-sync'
import { AuthProvider } from './lib/auth-context'
import { BookmarksProvider } from './lib/context'
import AddBookmarkPage from './pages/AddBookmarkPage'
import AddCollectionPage from './pages/AddCollectionPage'
import CollectionDetailPage from './pages/CollectionDetailPage'
import CollectionsPage from './pages/CollectionsPage'
import EditBookmarkPage from './pages/EditBookmarkPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OtpPage from './pages/OtpPage'
import RegisterPage from './pages/RegisterPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'

/** Activates background sync inside the auth+bookmarks context tree. */
function BackgroundSync() {
  useBackgroundSync()
  return null
}

export default function App() {
  return (
    <BookmarksProvider>
      <AuthProvider>
        <BrowserRouter>
          <BackgroundSync />
          <Routes>
            {/* Auth */}
            <Route path='/auth/login' element={<LoginPage />} />
            <Route path='/auth/register' element={<RegisterPage />} />
            <Route path='/auth/otp' element={<OtpPage />} />

            {/* Main app — tab layout */}
            <Route element={<TabLayout />}>
              <Route index element={<Navigate to='/home' replace />} />
              <Route path='/home' element={<HomePage />} />
              <Route path='/search' element={<SearchPage />} />
              <Route path='/collections' element={<CollectionsPage />} />
              <Route path='/settings' element={<SettingsPage />} />
            </Route>

            {/* Detail / modal screens */}
            <Route path='/bookmark/add' element={<AddBookmarkPage />} />
            <Route path='/bookmark/:id' element={<EditBookmarkPage />} />
            <Route path='/collection/add' element={<AddCollectionPage />} />
            <Route path='/collection/:id' element={<CollectionDetailPage />} />

            {/* Fallback */}
            <Route path='*' element={<Navigate to='/home' replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </BookmarksProvider>
  )
}
