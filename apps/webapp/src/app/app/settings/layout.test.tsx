import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsLayout from './layout';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('SettingsLayout', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/notifications');
  });

  it('renders the personal settings navigation and sparse future-facing note', () => {
    render(
      <SettingsLayout>
        <div>Settings content</div>
      </SettingsLayout>
    );

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Notifications' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Account' })).toHaveLength(1);
    expect(
      screen.getByText('More settings will appear here as the account grows.')
    ).toBeInTheDocument();
  });

  it('marks the longest matching route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/account');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const accountLink = screen.getByRole('link', { name: 'Account' });
    const notificationsLink = screen.getByRole('link', { name: 'Notifications' });
    expect(accountLink).toHaveAttribute('aria-current', 'page');
    expect(accountLink).toHaveClass('bg-muted', 'font-medium');
    expect(notificationsLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('exposes the active module and both destinations for mobile navigation', () => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/account');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/app/settings/notifications'
    );
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/app/settings/account'
    );
  });

  it('provides an accessible Back to App link', () => {
    render(<SettingsLayout>Settings content</SettingsLayout>);

    expect(screen.getByRole('link', { name: 'Back to app' })).toHaveAttribute('href', '/app');
  });

  it('places Back to App before the mobile module selector', () => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/account');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const backLink = screen.getByRole('link', { name: 'Back to app' });
    const moduleSelector = screen.getByRole('button', { name: 'Account' });

    expect(backLink.compareDocumentPosition(moduleSelector)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
