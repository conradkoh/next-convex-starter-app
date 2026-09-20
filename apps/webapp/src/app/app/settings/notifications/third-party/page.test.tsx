import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThirdPartyIntegrationsPage from './page';

import type { NotificationSettingsValue } from '@/modules/settings/NotificationsSettings';

const removeSettings = vi.fn();
let queryValue: NotificationSettingsValue | null | undefined;

const connectedSettings: NotificationSettingsValue = {
  provider: 'telegram',
  enabled: true,
  channelId: '@next_convex',
  hasBotToken: true,
  lastTestedAt: 1_700_000_000_000,
  lastTestSucceeded: true,
};

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionMutation: vi.fn(),
  useSessionQuery: vi.fn(),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) => (
    <button type="button" role="menuitem" onClick={onSelect}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children, ...props }: { children: ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

describe('ThirdPartyIntegrationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryValue = null;
    vi.mocked(useSessionQuery).mockImplementation(() => queryValue as never);
    vi.mocked(useSessionMutation).mockReturnValue(removeSettings as never);
    removeSettings.mockResolvedValue({ removed: true });
  });

  it('shows Telegram as available when no connection is configured', () => {
    render(<ThirdPartyIntegrationsPage />);

    expect(screen.getByRole('heading', { name: 'Available integrations' })).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configure' })).toHaveAttribute(
      'href',
      '/app/settings/notifications/third-party/telegram'
    );
    expect(
      screen.queryByRole('heading', { name: 'Connected integrations' })
    ).not.toBeInTheDocument();
  });

  it('shows safe connected status without rendering a token', () => {
    queryValue = connectedSettings;
    render(<ThirdPartyIntegrationsPage />);

    expect(screen.getByRole('heading', { name: 'Connected integrations' })).toBeInTheDocument();
    expect(screen.getByText('@next_convex')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Last test succeeded')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Actions for Telegram connection' })
    ).toBeInTheDocument();
    expect(screen.queryByText('123456:secret-token')).not.toBeInTheDocument();
  });

  it('exposes Update and Delete actions with an accessible menu', () => {
    queryValue = connectedSettings;
    render(<ThirdPartyIntegrationsPage />);

    expect(screen.getByRole('menuitem', { name: 'Update connection' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete connection' })).toBeInTheDocument();
  });

  it('deletes the connection after confirmation and reflects the unconfigured state', async () => {
    const user = userEvent.setup();
    queryValue = connectedSettings;
    const view = render(<ThirdPartyIntegrationsPage />);

    await user.click(screen.getByRole('menuitem', { name: 'Delete connection' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('removes the Telegram channel configuration');
    await user.click(screen.getByRole('button', { name: 'Delete connection' }));

    await waitFor(() => expect(removeSettings).toHaveBeenCalledWith({}));
    queryValue = null;
    view.rerender(<ThirdPartyIntegrationsPage />);
    expect(screen.getByRole('heading', { name: 'Available integrations' })).toBeInTheDocument();
  });

  it('shows safe deletion errors without provider details', async () => {
    const user = userEvent.setup();
    queryValue = connectedSettings;
    removeSettings.mockRejectedValueOnce(new Error('provider token leaked'));
    render(<ThirdPartyIntegrationsPage />);

    await user.click(screen.getByRole('menuitem', { name: 'Delete connection' }));
    await user.click(screen.getByRole('button', { name: 'Delete connection' }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Unable to remove the Telegram connection.'
      )
    );
    expect(screen.queryByText('provider token leaked')).not.toBeInTheDocument();
  });
});
