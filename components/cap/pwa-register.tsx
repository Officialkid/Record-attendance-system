'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (
      !('serviceWorker' in navigator) ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  return null;
}
