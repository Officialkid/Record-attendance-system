'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteDepartmentRecordAction } from '@/app/actions/cap';

export function DeleteRecordButton({ recordId }: { recordId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await deleteDepartmentRecordAction(recordId);
          if (!result.success) {
            window.alert(result.message);
            return;
          }

          router.refresh();
        });
      }}
      className="rounded-xl border border-[#ead4d4] bg-white px-3 py-2 text-xs font-medium text-[#a24444] disabled:opacity-60"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
