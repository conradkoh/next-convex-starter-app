import { render, screen } from '@testing-library/react';
import { useSessionQuery } from 'convex-helpers/react/sessions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsNotificationsPage from './page';

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionAction: vi.fn(() => vi.fn()),
  useSessionMutation: vi.fn(() => vi.fn()),
  useSessionQuery: vi.fn(),
}));

describe('Settings notifications page', () => {
  beforeEach(() => {
    vi.mocked(useSessionQuery).mockReturnValue(null as never);
  });

  it('renders the Notifications section and Telegram settings content', () => {
    render(<SettingsNotificationsPage />);

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(
      screen.getByText('Configure where your system notifications are delivered.')
    ).toBeInTheDocument();
    expect(screen.getByText('Telegram notifications')).toBeInTheDocument();
  });
});
