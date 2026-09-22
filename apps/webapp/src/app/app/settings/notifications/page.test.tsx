import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import NotificationsPage from './page';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('NotificationsPage', () => {
  it('links to the third-party integration listing', () => {
    render(<NotificationsPage />);

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Third-party integrations')).toBeInTheDocument();
    expect(
      screen.getByText(/external providers can deliver system notifications/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse integrations' })).toHaveAttribute(
      'href',
      '/app/settings/notifications/third-party'
    );
  });
});
