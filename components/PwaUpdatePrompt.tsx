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
    <div className="fixed bottom-4 left-1/2 z-[60] w-[92%] max-w-xl -translate-x-1/2 rounded-2xl border border-purple-100 bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Update available</p>
          <p className="text-xs text-gray-600">
            We have improved Insight Tracker. Refresh to get the latest changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="text-xs font-semibold text-purple-700 hover:text-purple-800"
          >
            View updates
          </Link>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
          >
            Update now
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
