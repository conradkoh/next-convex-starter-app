import { redirect } from 'next/navigation';

export default function ProfileCompatibilityPage() {
  redirect('/app/settings/user');
}
