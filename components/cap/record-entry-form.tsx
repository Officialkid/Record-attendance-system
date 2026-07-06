'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import {
  createDepartmentRecordAction,
  importProtocolRecordsAction,
  updateDepartmentRecordAction,
} from '@/app/actions/cap';
import { CopySummaryButton } from './copy-summary-button';
import type {
  Department,
  DepartmentFieldDefinition,
  DepartmentRecordDetail,
  UserRecord,
} from '@/lib/cap/types';

interface RecordEntryFormProps {
  departments: Department[];
  fieldDefinitions: Record<number, DepartmentFieldDefinition[]>;
  departmentMembers: Record<number, UserRecord[]>;
  defaultDepartmentId: number;
  defaultRecordDate: string;
  currentUserId: number;
  allowHandledBySelection?: boolean;
  allowDepartmentSelection?: boolean;
  existingRecord?: DepartmentRecordDetail;
}

type VisitorRow = {
  id: number;
  name: string;
  contact: string;
};

function toVisitorRows(record?: DepartmentRecordDetail): VisitorRow[] {
  if (!record) {
    return [];
  }

  return record.visitors.map((visitor, index) => ({
    id: visitor.id || Date.now() + index,
    name: visitor.name,
    contact: visitor.contact || '',
  }));
}

function toStringValues(record?: DepartmentRecordDetail) {
  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record.values).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join('\n') : value == null ? '' : String(value),
    ])
  );
}

export function RecordEntryForm({
  departments,
  fieldDefinitions,
  departmentMembers,
  defaultDepartmentId,
  defaultRecordDate,
  currentUserId,
  allowHandledBySelection = true,
  allowDepartmentSelection = true,
  existingRecord,
}: RecordEntryFormProps) {
  const router = useRouter();
  const isEditing = Boolean(existingRecord);
  const [departmentId, setDepartmentId] = useState(existingRecord?.departmentId || defaultDepartmentId);
  const [recordDate, setRecordDate] = useState(existingRecord?.recordDate || defaultRecordDate);
  const [handledByUserId, setHandledByUserId] = useState(existingRecord?.handledByUserId || currentUserId);
  const [values, setValues] = useState<Record<string, string>>(toStringValues(existingRecord));
  const [visitors, setVisitors] = useState<VisitorRow[]>(toVisitorRows(existingRecord));
  const [feedback, setFeedback] = useState<{ recordId: number; summary: string } | null>(null);
  const [error, setError] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [importError, setImportError] = useState('');
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = useMemo(() => fieldDefinitions[departmentId] || [], [departmentId, fieldDefinitions]);
  const members = useMemo(() => departmentMembers[departmentId] || [], [departmentId, departmentMembers]);
  const supportsProtocolImport = useMemo(
    () => ['offering', 'tithe', 'expenses', 'headcount'].every((fieldKey) => fields.some((field) => field.fieldKey === fieldKey)),
    [fields]
  );

  const handleFieldChange = (fieldKey: string, value: string) => {
    setValues((current) => ({ ...current, [fieldKey]: value }));
  };

  const renderFieldInput = (field: DepartmentFieldDefinition) => {
    const commonClasses =
      'w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none';

    if (field.fieldType === 'list') {
      return (
        <>
          <textarea
            required={field.isRequired}
            value={values[field.fieldKey] || ''}
            onChange={(event) => handleFieldChange(field.fieldKey, event.target.value)}
            rows={4}
            className={commonClasses}
            placeholder={`Enter ${field.label.toLowerCase()} on separate lines`}
          />
          <p className="text-xs text-[#5f5673]">Use one item per line or separate items with commas.</p>
        </>
      );
    }

    return (
      <input
        required={field.isRequired}
        type={
          field.fieldType === 'currency' || field.fieldType === 'number'
            ? 'number'
            : field.fieldType === 'date'
              ? 'date'
              : 'text'
        }
        step={field.fieldType === 'currency' ? '0.01' : '1'}
        value={values[field.fieldKey] || ''}
        onChange={(event) => handleFieldChange(field.fieldKey, event.target.value)}
        className={commonClasses}
        placeholder={field.fieldType === 'date' ? undefined : `Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  const addVisitor = () => {
    setVisitors((current) => [...current, { id: Date.now(), name: '', contact: '' }]);
  };

  const updateVisitor = (id: number, key: 'name' | 'contact', value: string) => {
    setVisitors((current) =>
      current.map((visitor) => (visitor.id === id ? { ...visitor, [key]: value } : visitor))
    );
  };

  const removeVisitor = (id: number) => {
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  };

  const resetCreateForm = () => {
    setValues({});
    setVisitors([]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setFeedback(null);

    startTransition(async () => {
      const payload = {
        departmentId,
        recordDate,
        handledByUserId,
        values,
        visitors: visitors
          .filter((visitor) => visitor.name.trim())
          .map((visitor) => ({
            name: visitor.name.trim(),
            contact: visitor.contact.trim(),
          })),
      };

      const result = isEditing
        ? await updateDepartmentRecordAction({
            recordId: existingRecord!.id,
            ...payload,
          })
        : await createDepartmentRecordAction(payload);

      if (!result.success || result.recordId === undefined || !result.whatsappSummary) {
        setError(result.message);
        return;
      }

      setFeedback({
        recordId: result.recordId,
        summary: result.whatsappSummary,
      });

      if (isEditing) {
        router.refresh();
      } else {
        resetCreateForm();
      }
    });
  };

  const handleImport = () => {
    setImportError('');
    setImportFeedback('');
    setFeedback(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('departmentId', String(departmentId));
      formData.set('handledByUserId', String(handledByUserId));
      formData.set('pastedText', importText);
      if (importFile) {
        formData.set('document', importFile);
      }

      const result = await importProtocolRecordsAction(formData);
      if (!result.success) {
        setImportError(result.message);
        return;
      }

      setImportFeedback(result.message);
      setImportText('');
      setImportFile(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {supportsProtocolImport ? (
        <section className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A461]">Quick import</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#241c33]">Load protocol records from a document</h3>
              <p className="mt-2 max-w-3xl text-sm text-[#5f5673]">
                Paste the extracted accounts table or upload the source file. CIOM Portal will read the rows, ignore
                balance, and create or update the matching weekly dates for this department.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e6def4] bg-[#fbf9fe] px-4 py-3 text-sm text-[#5f5673]">
              Imports use the selected department and handled-by member above.
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[#241c33]">Paste extracted table</span>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                rows={10}
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                placeholder="DATE    OFFERING    TITHE    EXPENSES    BALANCE    HEADCOUNT"
              />
            </label>

            <div className="space-y-4 rounded-[24px] border border-dashed border-[#d9cfee] bg-[#fbf9fe] p-4">
              <div>
                <p className="text-sm font-medium text-[#241c33]">Or upload a file</p>
                <p className="mt-2 text-sm text-[#5f5673]">
                  Supports `.txt`, `.md`, `.docx`, and `.pdf` files that contain the extracted weekly accounts table.
                </p>
              </div>
              <input
                type="file"
                accept=".txt,.md,.docx,.pdf"
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-[#241c33]"
              />
              <p className="rounded-2xl border border-[#e6def4] bg-white px-4 py-3 text-sm text-[#5f5673]">
                {importFile ? `Ready to import: ${importFile.name}` : 'No file selected yet.'}
              </p>
              <button
                type="button"
                disabled={pending || (!importText.trim() && !importFile)}
                onClick={handleImport}
                className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? 'Importing records...' : 'Import protocol records'}
              </button>
            </div>
          </div>

          {importError ? (
            <p className="mt-4 rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{importError}</p>
          ) : null}
          {importFeedback ? (
            <p className="mt-4 rounded-2xl bg-[#f4fff4] px-4 py-3 text-sm text-[#255b2f]">{importFeedback}</p>
          ) : null}
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Department</span>
            {allowDepartmentSelection ? (
              <select
                value={departmentId}
                onChange={(event) => {
                  const nextDepartmentId = Number(event.target.value);
                  setDepartmentId(nextDepartmentId);
                  const nextDefaultMember = departmentMembers[nextDepartmentId]?.[0]?.id || currentUserId;
                  setHandledByUserId(nextDefaultMember);
                }}
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm font-medium text-[#241c33]">
                {departments.find((department) => department.id === departmentId)?.name || 'Department context'}
              </div>
            )}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Record date</span>
            <input
              type="date"
              value={recordDate}
              onChange={(event) => setRecordDate(event.target.value)}
              className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#241c33]">Handled by</span>
            {allowHandledBySelection ? (
              <select
                value={handledByUserId}
                onChange={(event) => setHandledByUserId(Number(event.target.value))}
                className="w-full rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm font-medium text-[#241c33]">
                {members.find((member) => member.id === handledByUserId)?.name || 'Current signed-in member'}
              </div>
            )}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.id} className="space-y-2">
              <span className="text-sm font-medium text-[#241c33]">
                {field.label}
                {field.isRequired ? <span className="ml-1 text-[#C9A461]">*</span> : null}
              </span>
              {renderFieldInput(field)}
            </label>
          ))}
        </div>

        <div className="rounded-[24px] border border-dashed border-[#c9a461] bg-[#fffaf1] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[#241c33]">Visitors</h3>
              <p className="text-sm text-[#5f5673]">Capture names and contacts for weekly accountability.</p>
            </div>
            <button
              type="button"
              onClick={addVisitor}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4B248C] px-3 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Add visitor</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {visitors.length === 0 ? (
              <p className="rounded-2xl border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#5f5673]">
                No visitors added yet for this weekly record.
              </p>
            ) : null}

            {visitors.map((visitor) => (
              <div
                key={visitor.id}
                className="grid gap-3 rounded-2xl border border-[#eadfca] bg-white p-4 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  value={visitor.name}
                  onChange={(event) => updateVisitor(visitor.id, 'name', event.target.value)}
                  className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                  placeholder="Visitor name"
                />
                <input
                  value={visitor.contact}
                  onChange={(event) => updateVisitor(visitor.id, 'contact', event.target.value)}
                  className="rounded-2xl border border-[#d9cfee] bg-[#fbf9fe] px-4 py-3 text-sm text-[#241c33] outline-none"
                  placeholder="Phone or email"
                />
                <button
                  type="button"
                  onClick={() => removeVisitor(visitor.id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#e2d2ae] px-4 py-3 text-[#C9A461]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-sm text-[#a63e1c]">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending
            ? isEditing
              ? 'Updating record...'
              : 'Saving record...'
            : isEditing
              ? 'Update weekly record'
              : 'Save weekly record'}
        </button>
      </form>

      {feedback ? (
        <div className="rounded-[28px] border border-[#cfb76f] bg-[#fffaf0] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#C9A461]">
                {isEditing ? 'Updated successfully' : 'Saved successfully'}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#241c33]">WhatsApp-ready summary</h3>
            </div>
            <CopySummaryButton summary={feedback.summary} />
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm text-[#241c33]">
            {feedback.summary}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
