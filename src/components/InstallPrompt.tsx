import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isInstalled) {
      return;
    }

    // Show prompt after 2 seconds if not installed
    const showTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(showTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show prompt if not supposed to show
  if (!showPrompt) {
    return null;
  }

  // Detect device and browser for instructions
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent);
  const isFirefox = /Firefox/i.test(navigator.userAgent);
  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);

  let instructions = '';

  if (isIOS && isSafari) {
    instructions =
      'Tap the Share button (⎙) at the bottom, then tap "Add to Home Screen" to install this app!';
  } else if (isAndroid && isChrome) {
    instructions =
      'Tap the menu (⋮) at the top right, then tap "Add to Home screen" or "Install app" to install!';
  } else if (isAndroid && isSamsung) {
    instructions =
      'Tap the menu (⋮) at the bottom, then tap "Add page to" and select "Home screen" to install!';
  } else if (isAndroid && isFirefox) {
    instructions =
      'Tap the menu (⋮) at the top right, then tap "Install" to add this app to your home screen!';
  } else if (isMobile) {
    instructions =
      'Open your browser menu and look for "Add to Home screen" or "Install" to install this app!';
  } else {
    instructions = "Click the install icon in your browser's address bar to install this app!";
  }

  // Show the prompt with appropriate content
  return (
    <div className="animate-in slide-in-from-bottom-4 fixed right-4 bottom-20 left-4 z-50">
      <div className="bg-card border-border rounded-lg border p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
            <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="t mb-1 text-sm font-semibold">Install Bookmark Manager</h3>
            {deferredPrompt ? (
              <>
                <p className="text-muted-foreground mb-3 text-xs">
                  Install our app for quick access and offline use. Works on your home screen!
                </p>

                <div className="flex gap-2">
                  <Button onClick={handleInstall} variant="default">
                    Install
                  </Button>
                  <Button onClick={handleDismiss} variant="secondary">
                    Not now
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-secondary-foreground mb-3 text-xs">{instructions}</p>

                <Button variant="secondary" className="w-full" onClick={handleDismiss}>
                  Got it
                </Button>
              </>
            )}
          </div>

          <Button onClick={handleDismiss} variant="ghost" visualSize="icon-sm">
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
