import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppUnavailable } from './AppUnavailable';

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

describe('AppUnavailable', () => {
  it('renders the whole-app failure copy without providers or links', () => {
    render(<AppUnavailable />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      "The app isn't available right now"
    );
    expect(
      screen.getByText(
        'Reload the page to try again. If it keeps happening, try again in a few minutes.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });

  it('reloads and shows the pending label when the action is used', async () => {
    const user = userEvent.setup();
    render(<AppUnavailable />);

    await user.click(screen.getByRole('button', { name: 'Reload page' }));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reloading…' })).toBeDisabled();
  });

  it('shows the reference id parsed from the Convex request id', () => {
    render(<AppUnavailable error={new Error('[CONVEX Q(x)] [Request ID: abc123] Server Error')} />);

    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: abc123');
  });

  it('falls back to the digest as the reference id', () => {
    render(<AppUnavailable error={Object.assign(new Error('boom'), { digest: 'd1g3st' })} />);

    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: d1g3st');
  });
});
