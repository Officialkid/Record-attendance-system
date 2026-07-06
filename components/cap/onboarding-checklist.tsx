import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleDashed, Sparkles } from 'lucide-react';

type ChecklistStep = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  done: boolean;
};

export function OnboardingChecklist({
  name,
  steps,
}: {
  name: string;
  steps: ChecklistStep[];
}) {
  const completedCount = steps.filter((step) => step.done).length;
  const remainingCount = steps.length - completedCount;

  return (
    <details className="rounded-[32px] border border-[#ddd3f0] bg-[linear-gradient(135deg,#fffdfa_0%,#f8f4ff_48%,#f3edff_100%)] p-6 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A461]">Onboarding guide</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#241c33]">
            Step-by-step, {name || 'friend'}.
          </h2>
          <p className="mt-3 text-sm text-[#5f5673]">
            Open only when you need the guided setup again.
          </p>
        </div>

        <div className="rounded-2xl border border-[#eadfb8] bg-white px-4 py-3 text-sm text-[#5f5673]">
          <span className="font-semibold text-[#241c33]">{completedCount}</span> complete
          <span className="mx-2 text-[#c7bdd9]">/</span>
          <span className="font-semibold text-[#241c33]">{steps.length}</span> steps
          <p className="mt-1 text-xs text-[#7a7190]">
            {remainingCount === 0 ? 'You are ready to run the workflow.' : `${remainingCount} step(s) still worth doing.`}
          </p>
        </div>
      </summary>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={`rounded-3xl border p-5 ${
              step.done ? 'border-[#d8ead7] bg-[#f7fff5]' : 'border-[#e6def4] bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-2xl p-2 ${step.done ? 'bg-[#e8f7e7] text-[#2d7a38]' : 'bg-[#f4effb] text-[#4B248C]'}`}>
                {step.done ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7ca7]">Step {index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-[#241c33]">{step.title}</h3>
                <p className="mt-2 text-sm text-[#5f5673]">{step.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={step.href}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${
                      step.done ? 'border border-[#cfe5cf] bg-white text-[#2d7a38]' : 'bg-[#4B248C] text-white'
                    }`}
                  >
                    <span>{step.done ? 'Open again' : step.actionLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {step.done ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2d7a38]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Done
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}
