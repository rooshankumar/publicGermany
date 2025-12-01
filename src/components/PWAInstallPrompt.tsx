import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWA_PROMPT_DISMISSED_KEY = 'pwa_prompt_dismissed';
const PWA_PROMPT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

export function PWAInstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Don't show if installed or no prompt available
  if (isInstalled || !deferredPrompt) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="icon"
      className={className}
      title="Install App"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}

export function PWAInstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check cooldown
    const dismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < PWA_PROMPT_COOLDOWN) {
        return;
      }
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show popup after a short delay
      setTimeout(() => setShowPopup(true), 2000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPopup(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show manual install instructions after delay
    if (isIOSDevice) {
      const dismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY);
      if (!dismissed || Date.now() - parseInt(dismissed, 10) > PWA_PROMPT_COOLDOWN) {
        setTimeout(() => setShowPopup(true), 2000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowPopup(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, Date.now().toString());
  };

  // Don't show if installed
  if (isInstalled) return null;

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Install publicgermany</DialogTitle>
          <DialogDescription className="text-center">
            {isIOS ? (
              <>
                Add this app to your home screen for quick access. Tap the <strong>Share</strong> button, then select <strong>"Add to Home Screen"</strong>.
              </>
            ) : (
              <>
                Install our app on your device for quick access, offline support, and a better experience.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Not Now
          </Button>
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstall} className="w-full sm:w-auto btn-cta">
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          )}
          {isIOS && (
            <Button onClick={handleDismiss} className="w-full sm:w-auto btn-cta">
              Got It
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PWAInstallPopup;
