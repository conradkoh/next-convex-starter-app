import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CallbackSuccessCard } from './CallbackSuccessCard';

describe('CallbackSuccessCard', () => {
  it('renders login success message', () => {
    render(<CallbackSuccessCard flowType="login" userName="Alice" autoCloseDelay={10} />);
    expect(screen.getByText(/Welcome back, Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Closing in 10s/)).toBeInTheDocument();
  });

  it('calls onClose when countdown completes', async () => {
    const onClose = vi.fn();
    render(<CallbackSuccessCard onClose={onClose} autoCloseDelay={0} />);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 });
  });

  it('redirects to returnTo when countdown completes and no opener', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { assign: assign },
      writable: true,
    });
    Object.defineProperty(window, 'opener', {
      value: null,
      writable: true,
    });

    render(<CallbackSuccessCard redirectTo="/app" autoCloseDelay={0} />);
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('/app'), { timeout: 2000 });
  });

  it('shows redirecting text when redirectTo provided and no opener', () => {
    Object.defineProperty(window, 'opener', {
      value: null,
      writable: true,
    });

    render(<CallbackSuccessCard redirectTo="/app" autoCloseDelay={5} />);
    expect(screen.getByText(/Redirecting in 5s/)).toBeInTheDocument();
  });
});
