import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import type * as ReactTypes from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsLayout from './layout';

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactTypes.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = (await vi.importActual('react')) as typeof ReactTypes;
  const DropdownMenuContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
  } | null>(null);

  function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    return (
      <DropdownMenuContext.Provider value={{ open, setOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    );
  }

  function DropdownMenuTrigger({ children, ...props }: React.ComponentProps<'button'>) {
    const menu = React.useContext(DropdownMenuContext);
    if (!menu) throw new Error('DropdownMenuTrigger must be rendered inside DropdownMenu.');

    return (
      <button
        type="button"
        {...props}
        onClick={() => menu.setOpen(!menu.open)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            menu.setOpen(true);
          }
        }}
      >
        {children}
      </button>
    );
  }

  function DropdownMenuContent({ children }: { children: React.ReactNode }) {
    const menu = React.useContext(DropdownMenuContext);
    return menu?.open ? <div role="menu">{children}</div> : null;
  }

  function DropdownMenuItem({
    children,
    render,
    className,
    onSelect,
  }: {
    children: React.ReactNode;
    render?: React.ReactElement<Record<string, unknown>>;
    className?: string;
    onSelect?: () => void;
  }) {
    if (render) {
      return React.cloneElement(
        render,
        { className, role: 'menuitem', onClick: onSelect },
        children
      );
    }
    return (
      <button type="button" role="menuitem" className={className} onClick={onSelect}>
        {children}
      </button>
    );
  }

  return {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem,
    DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger,
  };
});

describe('SettingsLayout', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/user');
  });

  it('renders the personal settings navigation and sparse future-facing note', () => {
    render(
      <SettingsLayout>
        <div>Settings content</div>
      </SettingsLayout>
    );

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'User' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Appearance' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Notifications' })).toHaveLength(1);
    expect(
      screen.getByText('More settings will appear here as the account grows.')
    ).toBeInTheDocument();
  });

  it('renders primary modules in User, Appearance, Notifications order', () => {
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const links = [
      ...screen.getByRole('navigation', { name: 'Settings sections' }).querySelectorAll('a'),
    ];
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'User',
      'Appearance',
      'Notifications',
    ]);
  });

  it('marks the longest matching route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/notifications/third-party');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const userLink = screen.getByRole('link', { name: 'User' });
    const appearanceLink = screen.getByRole('link', { name: 'Appearance' });
    const notificationsLink = screen.getByRole('link', { name: 'Notifications' });
    expect(notificationsLink).toHaveAttribute('aria-current', 'page');
    expect(notificationsLink).toHaveClass('bg-muted', 'font-medium');
    expect(userLink).not.toHaveAttribute('aria-current', 'page');
    expect(appearanceLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('opens the active module selector and exposes mobile destinations', async () => {
    const user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue('/app/settings/appearance');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const trigger = screen.getByRole('button', { name: 'Appearance' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(trigger);
    const menu = screen.getByRole('menu');

    expect(within(menu).getByRole('menuitem', { name: 'User' })).toHaveAttribute(
      'href',
      '/app/settings/user'
    );
    expect(within(menu).getByRole('menuitem', { name: 'Appearance' })).toHaveAttribute(
      'href',
      '/app/settings/appearance'
    );
    expect(within(menu).getByRole('menuitem', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/app/settings/notifications'
    );
  });

  it('opens and activates a mobile destination with the keyboard', async () => {
    const user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue('/app/settings/appearance');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const trigger = screen.getByRole('button', { name: 'Appearance' });
    trigger.focus();
    await user.keyboard('{Enter}');

    const notifications = within(screen.getByRole('menu')).getByRole('menuitem', {
      name: 'Notifications',
    });
    expect(notifications).toHaveAttribute('href', '/app/settings/notifications');
    notifications.focus();
    await user.keyboard('{Enter}');
    expect(notifications).toHaveAttribute('href', '/app/settings/notifications');
  });

  it('provides an accessible Back to App link', () => {
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const backLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/app');
    expect(backLinks).toHaveLength(2);
    expect(backLinks.every((link) => link.querySelector('button') === null)).toBe(true);
    expect(screen.getByRole('link', { name: 'Back to app' })).toHaveAttribute('href', '/app');
  });

  it('places Back to App before the mobile module selector', () => {
    vi.mocked(usePathname).mockReturnValue('/app/settings/appearance');
    render(<SettingsLayout>Settings content</SettingsLayout>);

    const backLink = screen.getByRole('link', { name: 'Back to app' });
    const moduleSelector = screen.getByRole('button', { name: 'Appearance' });

    expect(backLink.compareDocumentPosition(moduleSelector)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
