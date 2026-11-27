import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found';

describe('not-found', () => {
  it('renders the neutral not-found panel with a home action', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
    expect(
      screen.getByText("The page you're looking for doesn't exist or may have moved.")
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to home' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });
});
