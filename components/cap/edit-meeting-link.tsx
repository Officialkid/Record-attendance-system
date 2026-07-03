import Link from 'next/link';

export function EditMeetingLink({ meetingId }: { meetingId: number }) {
  return (
    <Link
      href={`/meetings/${meetingId}/edit`}
      className="inline-flex items-center justify-center rounded-xl bg-[#ede7f7] px-3 py-2 text-xs font-medium text-[#4B248C]"
    >
      Edit meeting
    </Link>
  );
}
