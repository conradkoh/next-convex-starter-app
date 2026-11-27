import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NavigationFallback } from './NavigationFallback';

const reload = vi.fn();

let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload },
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
  reload.mockReset();
});

describe('NavigationFallback', () => {
  it('offers a plain home link in place of the navigation', () => {
    render(<NavigationFallback />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText("The menu couldn't load.")).toBeInTheDocument();
  });

  it('reloads and shows the pending label', async () => {
    const user = userEvent.setup();
    render(<NavigationFallback />);

    await user.click(screen.getByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reloading…' })).toBeDisabled();
  });
});
