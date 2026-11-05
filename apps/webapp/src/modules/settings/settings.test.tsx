import { render, screen } from '@testing-library/react';
import { useAction } from 'convex/react';
import { useSessionId } from 'convex-helpers/react/sessions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppearanceSettings } from './appearance/AppearanceSettings';
import { ProfileSettings } from './profile/ProfileSettings';
import { UserSettings } from './user/UserSettings';

vi.mock('@/modules/auth/LoginCodeGenerator', () => ({
  LoginCodeGenerator: () => <div data-testid="login-code-generator" />,
}));
vi.mock('@/modules/profile/NameEditForm', () => ({
  NameEditForm: () => <div data-testid="name-edit-form" />,
}));
vi.mock('@/modules/theme/ThemeSettings', () => ({
  ThemeSettings: () => <div data-testid="theme-settings" />,
}));
vi.mock('convex/react', () => ({ useAction: vi.fn() }));
vi.mock('convex-helpers/react/sessions', () => ({ useSessionId: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('settings module composition', () => {
  beforeEach(() => {
    vi.mocked(useAction).mockReturnValue(vi.fn() as never);
    vi.mocked(useSessionId).mockReturnValue(['session-id'] as never);
  });

  it('composes the User module without duplicating its low-level components', () => {
    render(<UserSettings />);

    expect(screen.getByRole('heading', { name: 'User details' })).toBeInTheDocument();
    expect(screen.getAllByTestId('name-edit-form')).toHaveLength(1);
    expect(screen.getAllByTestId('login-code-generator')).toHaveLength(1);
  });

  it('composes the Appearance module with ThemeSettings', () => {
    render(<AppearanceSettings />);

    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getAllByTestId('theme-settings')).toHaveLength(1);
  });

  it('renders the Profile recovery action without revealing a code by default', () => {
    render(<ProfileSettings />);

    expect(screen.getByRole('heading', { name: 'Account recovery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reveal Recovery Code' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/recovery/i)).not.toBeInTheDocument();
  });
});
