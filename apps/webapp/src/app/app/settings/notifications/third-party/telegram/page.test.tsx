import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useSessionAction,
  useSessionMutation,
  useSessionQuery,
} from 'convex-helpers/react/sessions';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TelegramSettingsPage from './page';

import type { NotificationSettingsValue } from '@/modules/settings/NotificationsSettings';

const push = vi.fn();
const saveSettings = vi.fn();
const testConnection = vi.fn();

const savedSettings: NotificationSettingsValue = {
  provider: 'telegram',
  enabled: true,
  channelId: '@next_convex',
  hasBotToken: true,
};

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionAction: vi.fn(),
  useSessionMutation: vi.fn(),
  useSessionQuery: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('TelegramSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSessionQuery).mockReturnValue(null as never);
    vi.mocked(useSessionMutation).mockReturnValue(saveSettings as never);
    vi.mocked(useSessionAction).mockReturnValue(testConnection as never);
    saveSettings.mockResolvedValue(savedSettings);
  });

  it('renders the first-use Configure Telegram form and breadcrumb', () => {
    render(<TelegramSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Configure Telegram' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bot token')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Third-party integrations' })).toHaveAttribute(
      'href',
      '/app/settings/notifications/third-party'
    );
  });

  it('renders Update Telegram without exposing a saved token', () => {
    vi.mocked(useSessionQuery).mockReturnValue(savedSettings as never);
    render(<TelegramSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Update Telegram' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bot token')).toHaveValue('');
    expect(screen.queryByDisplayValue('123456:secret-token')).not.toBeInTheDocument();
  });

  it('navigates back to the listing after a successful save', async () => {
    const user = userEvent.setup();
    render(<TelegramSettingsPage />);

    await user.type(screen.getByLabelText('Channel ID or username'), '@builds');
    await user.type(screen.getByLabelText('Bot token'), '123456:secret-token');
    const form = screen.getByRole('button', { name: 'Save settings' }).closest('form');
    if (!(form instanceof HTMLFormElement)) {
      throw new Error('Expected the Telegram settings form to be rendered.');
    }
    fireEvent.submit(form);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/app/settings/notifications/third-party')
    );
  });
});
