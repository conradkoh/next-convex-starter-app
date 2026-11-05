import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AppearanceSettingsPage from './page';

vi.mock('@/modules/settings/appearance/AppearanceSettings', () => ({
  AppearanceSettings: () => <div data-testid="appearance-settings-module" />,
}));

describe('AppearanceSettingsPage', () => {
  it('renders the Appearance page with its canonical module', () => {
    render(<AppearanceSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    expect(
      screen.getByText('Choose how the application looks on your devices.')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('appearance-settings-module')).toHaveLength(1);
  });
});
