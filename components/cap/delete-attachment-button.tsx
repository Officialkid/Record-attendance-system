'use client';

import { useState, useTransition } from 'react';

import { deleteAttachmentAction } from '@/app/actions/cap';

export function DeleteAttachmentButton({ attachmentId }: { attachmentId: number }) {
  const [feedback, setFeedback] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await deleteAttachmentAction(attachmentId);
            setFeedback(result.message);
          });
        }}
        className="rounded-full border border-[#eadfb8] bg-white px-3 py-1 text-xs font-medium text-[#a06f00] disabled:opacity-60"
      >
        {pending ? 'Removing...' : 'Remove'}
      </button>
      {feedback ? <p className="text-[11px] text-[#5f5673]">{feedback}</p> : null}
    </div>
  );
}
