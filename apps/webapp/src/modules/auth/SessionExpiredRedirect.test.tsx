import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionExpiredRedirect } from './SessionExpiredRedirect';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

describe('SessionExpiredRedirect', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
  });

  it('announces the expiry and redirects to sign in', async () => {
    render(<SessionExpiredRedirect />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session has expired. Redirecting to sign in…'
    );
    expect(screen.getByRole('link', { name: 'Sign in now' })).toHaveAttribute('href', '/login');
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
  });
});
