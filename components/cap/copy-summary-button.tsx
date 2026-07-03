'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopySummaryButton({ summary }: { summary: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-[#e0d0a8] bg-[#fffaf0] px-3 py-2 text-sm font-medium text-[#4B248C] transition-colors hover:bg-[#f7edd4]"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span>{copied ? 'Copied' : 'Copy summary'}</span>
    </button>
  );
}
