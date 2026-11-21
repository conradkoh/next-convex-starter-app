import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GoogleAuthConfigPage from './page';

const mocks = vi.hoisted(() => ({
  config: undefined as unknown,
  toggleEnabled: vi.fn(),
  updateConfig: vi.fn(),
  testConfig: vi.fn(),
  resetConfig: vi.fn(),
}));

vi.mock('@workspace/backend/convex/_generated/api', () => ({
  api: {
    system: {
      auth: {
        google: {
          getConfig: 'system/auth/google:getConfig',
          toggleEnabled: 'system/auth/google:toggleEnabled',
          updateConfig: 'system/auth/google:updateConfig',
          testConfig: 'system/auth/google:testConfig',
          resetConfig: 'system/auth/google:resetConfig',
        },
      },
    },
  },
}));
vi.mock('convex-helpers/react/sessions', () => ({
  useSessionQuery: () => mocks.config,
  useSessionMutation: (ref: string) =>
    ({
      'system/auth/google:toggleEnabled': mocks.toggleEnabled,
      'system/auth/google:updateConfig': mocks.updateConfig,
      'system/auth/google:resetConfig': mocks.resetConfig,
    })[ref],
  useSessionAction: () => mocks.testConfig,
}));
vi.mock('@/modules/app/useAppInfo', () => ({
  useAppInfo: () => ({ isLoading: false }),
}));

const origin = window.location.origin;
const redirectUri = `${origin}/api/auth/google/callback`;

beforeEach(() => {
  mocks.config = {
    enabled: false,
    projectId: '',
    clientId: '',
    isConfigured: false,
    hasClientSecret: false,
  };
  mocks.toggleEnabled.mockReset().mockResolvedValue({ success: true, message: '' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** The Copy button in the read-only row that shows `value`. */
function copyButtonFor(value: string) {
  const input = screen.getByDisplayValue(value);
  return within(input.parentElement as HTMLElement).getByRole('button');
}

function getToggle() {
  return screen.getByRole('switch');
}

describe('GoogleAuthConfigPage copy rows', () => {
  it('swaps Copy to Copied with a check icon for 2 seconds, then reverts; other rows are unaffected', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<GoogleAuthConfigPage />);

    await user.click(copyButtonFor(origin));

    expect(writeText).toHaveBeenCalledWith(origin);
    const copied = await screen.findByRole('button', { name: 'Copied' });
    expect(copied.querySelector('.lucide-check')).not.toBeNull();
    expect(copyButtonFor(redirectUri)).toHaveAccessibleName('Copy');

    await waitFor(() => expect(copyButtonFor(origin)).toHaveAccessibleName('Copy'), {
      timeout: 3000,
    });
  });

  it('shows the copy failure under that row and clears it on the next copy', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // the hook logs the rejection
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValueOnce(undefined);
    render(<GoogleAuthConfigPage />);

    await user.click(copyButtonFor(origin));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to copy to clipboard');
    expect(alert.parentElement).toContainElement(screen.getByDisplayValue(origin));
    expect(copyButtonFor(origin)).toHaveAccessibleName('Copy');

    await user.click(copyButtonFor(origin));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('GoogleAuthConfigPage enable toggle', () => {
  it('shows one alert under the switch row when the toggle is rejected, and the switch stays off', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.toggleEnabled.mockReset().mockRejectedValueOnce(new Error('boom'));
    const user = userEvent.setup();
    render(<GoogleAuthConfigPage />);

    await user.click(getToggle());

    expect(mocks.toggleEnabled).toHaveBeenCalledWith({ enabled: true });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to toggle Google Auth. Please try again.');
    expect(alert.previousElementSibling).toContainElement(getToggle());
    expect(getToggle()).toHaveAttribute('aria-checked', 'false');
  });

  it('clears the alert when the next toggle starts', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.toggleEnabled
      .mockReset()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ success: true, message: '' });
    const user = userEvent.setup();
    render(<GoogleAuthConfigPage />);
    await user.click(getToggle());
    await screen.findByRole('alert');

    await user.click(getToggle());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no message when the toggle succeeds', async () => {
    const user = userEvent.setup();
    render(<GoogleAuthConfigPage />);

    await user.click(getToggle());

    await waitFor(() => expect(getToggle()).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByText('Users can sign in with Google')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
