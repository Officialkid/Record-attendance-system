'use client';

import { useTransition } from 'react';

import { toggleActionItemStatusAction } from '@/app/actions/cap';

export function ActionItemToggle({ actionItemId, status }: { actionItemId: number; status: 'open' | 'done' }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleActionItemStatusAction(actionItemId);
          } catch {
            // Keep the list stable even if the action fails; the next refresh will reflect the true state.
          }
        })
      }
      className="rounded-xl border border-[#dbcdec] bg-[#f8f5fd] px-3 py-2 text-xs font-medium text-[#4B248C]"
    >
      {pending ? 'Updating...' : status === 'open' ? 'Mark done' : 'Reopen'}
    </button>
  );
}
