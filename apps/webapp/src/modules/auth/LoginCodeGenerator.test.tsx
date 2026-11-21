import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginCodeGenerator } from './LoginCodeGenerator';

/**
 * Boundary mocks only: Convex session query/mutation, the auth state provider,
 * the browser clipboard, and sonner (asserted never called).
 * The component and its reducer run for real.
 */
const mocks = vi.hoisted(() => ({
  useAuthState: vi.fn(),
  useSessionQuery: vi.fn(),
  createLoginCode: vi.fn(),
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/modules/auth/AuthProvider', () => ({ useAuthState: mocks.useAuthState }));
vi.mock('convex-helpers/react/sessions', () => ({
  useSessionQuery: mocks.useSessionQuery,
  useSessionMutation: () => mocks.createLoginCode,
}));
vi.mock('sonner', () => ({ toast: mocks.toast }));

const USED = { success: false, reason: 'no_active_code' };

function activeCode(expiresAt = Date.now() + 60_000) {
  return { success: true, code: 'ABCD2345', expiresAt };
}

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.useAuthState.mockReturnValue({ state: 'authenticated', user: { _id: 'user1' } });
  mocks.useSessionQuery.mockReturnValue(undefined);
  mocks.createLoginCode.mockResolvedValue({
    success: true,
    code: 'WXYZ2345',
    expiresAt: Date.now() + 60_000,
  });
  mockClipboard(vi.fn().mockResolvedValue(undefined));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('LoginCodeGenerator feedback', () => {
  it('shows the used-code status line once the active code is consumed, with no toast', () => {
    const { rerender } = render(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(activeCode());
    rerender(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(USED);
    rerender(<LoginCodeGenerator />);

    expect(screen.getByRole('status')).toHaveTextContent('Your login code was used successfully');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.toast.info).not.toHaveBeenCalled();
  });

  it('does not show the used-code status line when the code expired before the query changed', () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(activeCode(Date.now() + 1_000));
    rerender(<LoginCodeGenerator />);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText('Expired')).toBeInTheDocument();

    mocks.useSessionQuery.mockReturnValue(USED);
    rerender(<LoginCodeGenerator />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears the used-code status line on the next generate', async () => {
    const { rerender } = render(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(activeCode());
    rerender(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(USED);
    rerender(<LoginCodeGenerator />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('shows one generate alert when the server reports a failed result', async () => {
    mocks.createLoginCode.mockResolvedValue({ success: false });
    render(<LoginCodeGenerator />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to generate login code');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('shows the generic generate alert when the mutation throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.createLoginCode.mockRejectedValue(new Error('network down'));
    render(<LoginCodeGenerator />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An error occurred while generating login code'
    );
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('clears the generate alert when the next generate starts', async () => {
    mocks.createLoginCode
      .mockResolvedValueOnce({ success: false })
      .mockReturnValueOnce(new Promise(() => {}));
    render(<LoginCodeGenerator />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows one copy alert when the clipboard write is rejected and keeps the code visible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const { rerender } = render(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(activeCode());
    rerender(<LoginCodeGenerator />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy login code to clipboard' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to copy code to clipboard');
    expect(
      screen.getByRole('button', { name: 'Copy login code to clipboard' })
    ).toBeInTheDocument();
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('copy success shows the Check icon for 2 s with no alert and no toast', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<LoginCodeGenerator />);
    mocks.useSessionQuery.mockReturnValue(activeCode());
    rerender(<LoginCodeGenerator />);
    const copyButton = screen.getByRole('button', { name: 'Copy login code to clipboard' });

    fireEvent.click(copyButton);
    await act(async () => {});

    expect(copyButton.querySelector('.text-green-600')).not.toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.toast.success).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(copyButton.querySelector('.text-green-600')).toBeNull();
  });

  it('shows no alert and no toast after a successful generate', async () => {
    render(<LoginCodeGenerator />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate a login code' }));

    expect(await screen.findByText(/Valid for/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.toast.success).not.toHaveBeenCalled();
  });
});
