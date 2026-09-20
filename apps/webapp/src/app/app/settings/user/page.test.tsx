import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import UserSettingsPage from './page';

vi.mock('@/modules/settings/user/UserSettings', () => ({
  UserSettings: () => <div data-testid="user-settings-module" />,
}));
vi.mock('@/modules/settings/profile/ProfileSettings', () => ({
  ProfileSettings: () => <div data-testid="profile-settings-module" />,
}));

describe('UserSettingsPage', () => {
  it('renders the User page with User and Profile modules', () => {
    render(<UserSettingsPage />);

    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument();
    expect(
      screen.getByText('Manage your user information, account access, and recovery options.')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('user-settings-module')).toHaveLength(1);
    expect(screen.getAllByTestId('profile-settings-module')).toHaveLength(1);
  });
});
