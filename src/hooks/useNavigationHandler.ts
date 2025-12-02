import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to handle back button navigation with native app-like behavior.
 *
 * Navigation hierarchy:
 * - Detail pages (collection detail, recycle bin, share target) → Home or their parent page
 * - Tab pages (collections, search, profile) → Home
 * - Home → Exit app (handled by browser)
 *
 * This prevents the user from jumping through browser history and provides
 * a predictable navigation experience similar to native mobile apps.
 */

interface NavigationConfig {
  /** If true, pressing back will show exit confirmation */
  isHomePage?: boolean;
  /** Custom back handler - if provided, this will be called instead of default navigation */
  onBack?: () => void;
  /** The path to navigate to when back is pressed (defaults based on current route) */
  backPath?: string;
  /** Callback to show exit confirmation dialog on home page */
  onShowExitConfirm?: () => void;
}

export function useNavigationHandler(config: NavigationConfig = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHomePage = false, onBack, backPath, onShowExitConfirm } = config;
  const [shouldShowExitConfirm, setShouldShowExitConfirm] = useState(false);

  // Determine the appropriate back destination based on current path
  const getBackDestination = useCallback(() => {
    if (backPath) return backPath;

    const path = location.pathname;

    // Collection detail pages go back to collections
    if (path.startsWith('/collections/')) {
      return '/collections';
    }

    // Recycle bin goes back to home
    if (path === '/recycle-bin') {
      return '/';
    }

    // Share target goes back to home
    if (path === '/share') {
      return '/';
    }

    // Tab pages (collections, search, profile) go back to home
    if (['/collections', '/search', '/profile'].includes(path)) {
      return '/';
    }

    // Default to home
    return '/';
  }, [location.pathname, backPath]);

  // Handle back button press
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    if (isHomePage) {
      // On home page, let the browser handle it (user exits app)
      // We can show a toast or confirmation here if needed
      window.history.back();
      return;
    }

    // Navigate to the appropriate destination
    const destination = getBackDestination();
    navigate(destination, { replace: true });
  }, [isHomePage, onBack, navigate, getBackDestination]);

  // Handle exit confirmation
  const confirmExit = useCallback(() => {
    setShouldShowExitConfirm(false);
    window.history.back();
  }, []);

  const cancelExit = useCallback(() => {
    setShouldShowExitConfirm(false);
    // Push a new state to prevent exit
    window.history.pushState(null, '', location.pathname);
  }, [location.pathname]);

  // Intercept browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      if (isHomePage) {
        // On home page, show exit confirmation
        if (onShowExitConfirm) {
          onShowExitConfirm();
        } else {
          setShouldShowExitConfirm(true);
        }
        // Push a new state to prevent immediate exit
        window.history.pushState(null, '', location.pathname);
      } else {
        // For other pages, navigate to parent
        const destination = getBackDestination();
        navigate(destination, { replace: true });
      }
    };

    // Push a state to enable popstate interception
    window.history.pushState(null, '', location.pathname);

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isHomePage, location.pathname, navigate, getBackDestination, onShowExitConfirm]);

  return {
    handleBack,
    backDestination: getBackDestination(),
    shouldShowExitConfirm,
    confirmExit,
    cancelExit,
  };
}
