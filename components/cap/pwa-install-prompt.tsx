'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome !== 'accepted') {
      setDismissed(true);
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(92vw,24rem)] rounded-[24px] border border-[#ddd3f0] bg-white/95 p-4 shadow-[0_20px_60px_rgba(75,36,140,0.18)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#f3ecff] p-3 text-[#4B248C]">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#241c33]">Install CIOM Portal on this device</p>
          <p className="mt-1 text-xs leading-5 text-[#5f5673]">
            Add the ministry portal to your phone or desktop for faster access and an app-like experience.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-xl bg-[#4B248C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#341765]"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-xl border border-[#ddd3f0] px-3 py-2 text-xs font-semibold text-[#5f5673] hover:bg-[#f8f5fd]"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
