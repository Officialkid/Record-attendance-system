import { redirect } from 'next/navigation';

export default function LegacyAddAttendancePage() {
  redirect('/records/new');
}
