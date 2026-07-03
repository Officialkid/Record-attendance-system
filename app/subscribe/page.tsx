import { redirect } from 'next/navigation';

export default function LegacySubscribePage() {
  redirect('/login');
}
