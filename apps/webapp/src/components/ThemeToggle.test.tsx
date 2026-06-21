import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from './ThemeToggle';

const setTheme = vi.fn();
vi.mock('@/modules/theme/ThemeProvider', () => ({
  useTheme: () => ({ setTheme }),
}));

vi.mock('@/components/ui/dropdown-menu', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    DropdownMenuContent: ({
      children,
      ...props
    }: {
      children: ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  };
});

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('calls setTheme when light option clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByText('Light'));
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
