'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';

import { setActiveUserContextAction } from '@/app/actions/cap';
import type { UserContextOption } from '@/lib/cap/types';

export function ContextSwitcher({
  activeLabel,
  options,
}: {
  activeLabel: string;
  options: UserContextOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <div className="min-w-[260px]">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9A461]">
        Switch context
      </label>
      <div className="mt-2 rounded-2xl border border-[#e6def4] bg-[#fbf9fe] p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#241c33]">{activeLabel}</p>
            <p className="text-xs text-[#7a7190]">Change what this session is focused on.</p>
          </div>
          {pending ? <Loader2 className="h-4 w-4 animate-spin text-[#4B248C]" /> : <ChevronDown className="h-4 w-4 text-[#4B248C]" />}
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={`${option.key}:${option.href}`}
              type="button"
              disabled={pending || option.isActive}
              onClick={() => {
                setError('');
                startTransition(async () => {
                  const result = await setActiveUserContextAction({
                    contextType: option.contextType,
                    targetId: option.targetId,
                  });

                  if (!result.success) {
                    setError(result.message);
                    return;
                  }

                  router.push(option.href);
                  router.refresh();
                });
              }}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                option.isActive
                  ? 'border-[#d9c9f3] bg-white text-[#241c33]'
                  : 'border-transparent bg-white/70 text-[#4c4560] hover:border-[#e6def4] hover:bg-white'
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs text-[#7a7190]">{option.description}</p>
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 rounded-2xl bg-[#fff1ec] px-3 py-2 text-xs text-[#a63e1c]">{error}</p> : null}
      </div>
    </div>
  );
}
