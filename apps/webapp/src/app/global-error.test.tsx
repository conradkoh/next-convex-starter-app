import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GlobalError from './global-error';

import { setErrorReporter, type ErrorReport } from '@/lib/errors';

// The component imports globals.css to style the standalone document; the test does not need it.
vi.mock('./globals.css', () => ({}));
describe('global-error', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let restoreReporter: () => void;
  let reporter: (report: ErrorReport) => void;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    reporter = vi.fn<(report: ErrorReport) => void>();
    restoreReporter = setErrorReporter(reporter);
  });

  afterEach(() => {
    consoleError.mockRestore();
    restoreReporter();
  });

  it('renders the whole-app failure screen with the digest reference', async () => {
    render(
      <GlobalError
        error={Object.assign(new Error('root crash'), { digest: 'g1' })}
        reset={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      "The app isn't available right now"
    );
    expect(screen.getByText(/Reference:/)).toHaveTextContent('Reference: g1');
    await waitFor(() =>
      expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ scope: 'global' }))
    );

    const script = document.head.querySelector('script');
    expect(script?.innerHTML).toContain('classList.toggle');
    expect(script?.innerHTML).toMatch(/["']dark["']/);
  });
});
