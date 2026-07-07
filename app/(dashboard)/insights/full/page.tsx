import { notFound } from 'next/navigation';

import { FullInsightsView } from '@/components/cap/full-insights-view';
import { getSession } from '@/lib/cap/auth';
import {
  getDepartmentFieldDefinitions,
  getInsightsForDepartment,
  listRecordWorkflowDepartmentsForUser,
} from '@/lib/cap/services';

function shiftDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function resolveRange(range: string | undefined, start?: string, end?: string) {
  if (range === 'custom' && start && end) {
    return { activeRange: 'custom' as const, start, end };
  }

  if (range === '1m') {
    return { activeRange: '1m' as const, start: shiftDays(30), end: new Date().toISOString().slice(0, 10) };
  }

  if (range === '6m') {
    return { activeRange: '6m' as const, start: shiftDays(180), end: new Date().toISOString().slice(0, 10) };
  }

  if (range === '12m') {
    return { activeRange: '12m' as const, start: shiftDays(365), end: new Date().toISOString().slice(0, 10) };
  }

  return { activeRange: '3m' as const, start: shiftDays(90), end: new Date().toISOString().slice(0, 10) };
}

export default async function FullInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{
    departmentId?: string;
    start?: string;
    end?: string;
    range?: string;
    metric?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const allDepartments = await listRecordWorkflowDepartmentsForUser(session!.user);
  const fieldDefinitionsByDepartment = Object.fromEntries(
    await Promise.all(
      allDepartments.map(async (department) => [department.id, await getDepartmentFieldDefinitions(department.id)])
    )
  );
  const departments = allDepartments.filter(
    (department) => (fieldDefinitionsByDepartment[department.id] || []).length > 0
  );

  if (departments.length === 0) {
    notFound();
  }

  const selectedDepartmentId = Number(params.departmentId || departments[0]?.id || 1);
  if (!departments.some((department) => department.id === selectedDepartmentId)) {
    notFound();
  }

  const range = resolveRange(params.range, params.start, params.end);
  const insights = await getInsightsForDepartment(session!.user, selectedDepartmentId, {
    start: range.start,
    end: range.end,
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Insight engine</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#241c33]">{insights.department.name} full analysis</h2>
        <p className="mt-2 text-sm text-[#5f5673]">
          One shared page for all charts, weekly tables, and leadership review filters.
        </p>
      </div>

      <FullInsightsView
        insights={insights}
        departmentId={selectedDepartmentId}
        activeRange={range.activeRange}
        start={range.start}
        end={range.end}
        focusMetric={params.metric}
      />
    </section>
  );
}
