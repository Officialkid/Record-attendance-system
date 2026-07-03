'use client';

import { useState, useTransition } from 'react';

import { createAttachmentUploadAction, registerAttachmentAction } from '@/app/actions/cap';

export function AttachmentUpload({ meetingId }: { meetingId: number }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <input
        type="file"
        className="text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          startTransition(async () => {
            const uploadPlan = await createAttachmentUploadAction({
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
            });

            if (!uploadPlan.success || !uploadPlan.uploadUrl || !uploadPlan.key) {
              setMessage(uploadPlan.message);
              return;
            }

            const response = await fetch(uploadPlan.uploadUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
              },
            });

            if (!response.ok) {
              setMessage('Upload failed before attachment registration.');
              return;
            }

            const registered = await registerAttachmentAction({
              meetingId,
              r2Key: uploadPlan.key,
              filename: file.name,
            });
            setMessage(registered.message);
          });
        }}
      />
      {message ? <p className="text-xs text-[#5f5673]">{message}</p> : null}
      {pending ? <p className="text-xs text-[#4B248C]">Uploading attachment...</p> : null}
    </div>
  );
}
