import { redirect } from 'next/navigation';

export default function AccountSettingsCompatibilityPage() {
  redirect('/app/settings/user');
}
