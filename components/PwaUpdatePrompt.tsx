'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function PwaUpdatePrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready
      .then((registration) => {
        registrationRef.current = registration;

        if (registration.waiting) {
          setIsVisible(true);
          return;
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsVisible(true);
            }
          });
        });
      })
      .catch(() => undefined);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    const registration = registrationRef.current;
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[92%] max-w-xl -translate-x-1/2 rounded-[24px] border border-[#ddd3f0] bg-white/95 p-4 shadow-[0_20px_60px_rgba(75,36,140,0.18)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#241c33]">CAP update available</p>
          <p className="text-xs text-[#5f5673]">
            Refresh to load the latest portal changes and ministry tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="text-xs font-semibold text-[#4B248C] hover:text-[#341765]"
          >
            View updates
          </Link>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-xl bg-[#4B248C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#341765]"
          >
            Update now
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="rounded-xl border border-[#ddd3f0] px-3 py-2 text-xs font-semibold text-[#5f5673] hover:bg-[#f8f5fd]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
