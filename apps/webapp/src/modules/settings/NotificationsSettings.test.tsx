import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSessionAction, useSessionMutation } from 'convex-helpers/react/sessions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationsSettings, type NotificationSettingsValue } from './NotificationsSettings';

vi.mock('convex-helpers/react/sessions', () => ({
  useSessionAction: vi.fn(),
  useSessionMutation: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const saveSettings = vi.fn();
const removeSettings = vi.fn();
const testConnection = vi.fn();
let mutationHookCall = 0;

const savedSettings: NotificationSettingsValue = {
  provider: 'telegram',
  enabled: true,
  channelId: '@next_convex',
  hasBotToken: true,
};

function renderSettings(settings: NotificationSettingsValue | null = null) {
  mutationHookCall = 0;
  vi.mocked(useSessionMutation).mockImplementation(() => {
    const mutation = mutationHookCall % 2 === 0 ? saveSettings : removeSettings;
    mutationHookCall += 1;
    return mutation as never;
  });
  vi.mocked(useSessionAction).mockReturnValue(testConnection as never);
  return render(<NotificationsSettings settings={settings} />);
}

function getSettingsForm(): HTMLFormElement {
  const form = screen.getByRole('button', { name: 'Save settings' }).closest('form');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Expected the notification form to be rendered.');
  }
  return form;
}

describe('NotificationsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveSettings.mockResolvedValue(savedSettings);
    removeSettings.mockResolvedValue({ removed: true });
    testConnection.mockResolvedValue({
      success: true,
      message: 'Test notification sent successfully.',
    });
  });

  it('renders the first-use Telegram form and setup guidance', () => {
    renderSettings();

    expect(screen.getByText('Telegram notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Channel ID or username')).toBeInTheDocument();
    expect(screen.getByLabelText('Bot token')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked();
    expect(screen.getByText(/Add the bot to the target channel/i)).toBeInTheDocument();
    expect(screen.getByText('Save a configuration before testing.')).toBeInTheDocument();
  });

  it('never renders a saved token and explains how to preserve it', () => {
    renderSettings(savedSettings);

    const tokenInput = screen.getByLabelText('Bot token');
    expect(tokenInput).toHaveValue('');
    expect(tokenInput).toHaveAttribute('placeholder', 'Leave blank to keep the saved bot token');
    expect(screen.queryByDisplayValue('123456:secret-token')).not.toBeInTheDocument();
  });

  it('saves the channel, enabled state, and entered token', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText('Channel ID or username'), '  @builds  ');
    await user.type(screen.getByLabelText('Bot token'), '  123456:secret-token  ');
    fireEvent.submit(getSettingsForm());

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({
        channelId: '@builds',
        botToken: '123456:secret-token',
        enabled: true,
      });
    });
    expect(screen.getByLabelText('Bot token')).toHaveValue('');
  });

  it('sends a blank token when updating an existing configuration', async () => {
    const user = userEvent.setup();
    renderSettings(savedSettings);

    await user.clear(screen.getByLabelText('Channel ID or username'));
    await user.type(screen.getByLabelText('Channel ID or username'), '@updated_channel');
    fireEvent.submit(getSettingsForm());

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith({
        channelId: '@updated_channel',
        botToken: '',
        enabled: true,
      });
    });
  });

  it('keeps test disabled until a saved form is clean', async () => {
    const user = userEvent.setup();
    renderSettings();

    const testButton = screen.getByRole('button', { name: 'Test connection' });
    expect(testButton).toBeDisabled();
    expect(testConnection).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Channel ID or username'), '@builds');
    await user.type(screen.getByLabelText('Bot token'), '123456:secret-token');
    expect(testButton).toBeDisabled();

    fireEvent.submit(getSettingsForm());
    await waitFor(() => expect(testButton).toBeEnabled());
    await user.click(testButton);

    await waitFor(() => expect(testConnection).toHaveBeenCalledWith({}));
    expect(screen.getByText('Test notification sent successfully.')).toBeInTheDocument();
  });

  it('removes a saved configuration after confirmation and returns to first use', async () => {
    renderSettings(savedSettings);

    fireEvent.click(screen.getByRole('button', { name: 'Remove configuration' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('channel and bot token configuration');
    fireEvent.click(screen.getByRole('button', { name: 'Remove configuration' }));

    await waitFor(() => expect(removeSettings).toHaveBeenCalledWith({}));
    expect(screen.getByLabelText('Channel ID or username')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Remove configuration' })).not.toBeInTheDocument();
    expect(screen.getByText('Telegram notification settings removed.')).toBeInTheDocument();
  });

  it('shows safe accessible errors without exposing thrown details', async () => {
    const user = userEvent.setup();
    saveSettings.mockRejectedValueOnce(new Error('bot token leaked by provider'));
    renderSettings();

    await user.type(screen.getByLabelText('Channel ID or username'), '@builds');
    await user.type(screen.getByLabelText('Bot token'), '123456:secret-token');
    fireEvent.submit(getSettingsForm());

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Unable to save notification settings.')
    );
    expect(screen.queryByText('bot token leaked by provider')).not.toBeInTheDocument();
  });
});
