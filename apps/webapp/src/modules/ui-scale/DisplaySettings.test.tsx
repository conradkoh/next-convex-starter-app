import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DisplaySettings } from './DisplaySettings';

const mocks = vi.hoisted(() => ({
  isUiScaleReady: true,
  setUiScale: vi.fn(),
  uiScale: 100 as number | null,
}));

vi.mock('@/modules/ui-scale/UiScaleProvider', () => ({
  useUiScale: () => ({
    isUiScaleReady: mocks.isUiScaleReady,
    setUiScale: mocks.setUiScale,
    uiScale: mocks.uiScale,
  }),
}));

const PRESETS = [67, 75, 80, 90, 100, 110, 125] as const;

function accessibleName(preset: number) {
  return preset === 100 ? '100% (default)' : `${preset}%`;
}

beforeEach(() => {
  mocks.isUiScaleReady = true;
  mocks.setUiScale.mockReset();
  mocks.uiScale = 100;
});

describe('DisplaySettings', () => {
  it('renders the seven presets in order', () => {
    render(<DisplaySettings />);

    const radios = PRESETS.map((preset) =>
      screen.getByRole('radio', { name: accessibleName(preset) })
    );

    for (let index = 1; index < radios.length; index += 1) {
      expect(
        radios[index - 1].compareDocumentPosition(radios[index]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it('checks the stored preset', () => {
    mocks.uiScale = 67;
    render(<DisplaySettings />);

    expect(screen.getByRole('radio', { name: '67%' })).toBeChecked();
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  it('checks 100% by default', () => {
    render(<DisplaySettings />);

    expect(screen.getByRole('radio', { name: '100% (default)' })).toBeChecked();
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
  });

  it('applies the chosen scale and shows no message', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    await user.click(screen.getByRole('radio', { name: '125%' }));

    expect(mocks.setUiScale).toHaveBeenCalledWith(125);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/display size (changed|saved)/i)).not.toBeInTheDocument();
  });

  it('selects when the visible label text is clicked', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    await user.click(screen.getByText('125%'));

    expect(mocks.setUiScale).toHaveBeenCalledWith(125);
  });

  it('moves right with ArrowRight', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    screen.getByRole('radio', { name: '100% (default)' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(mocks.setUiScale).toHaveBeenCalledWith(110);
  });

  it('moves left with ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<DisplaySettings />);

    screen.getByRole('radio', { name: '100% (default)' }).focus();
    await user.keyboard('{ArrowLeft}');

    expect(mocks.setUiScale).toHaveBeenCalledWith(90);
  });

  it('shows the loading skeleton with no radios until the stored value resolves', () => {
    mocks.isUiScaleReady = false;
    mocks.uiScale = null;
    render(<DisplaySettings />);

    const loadingGroup = screen.getByRole('group', { name: 'Loading display size preferences' });
    expect(loadingGroup).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('names the group and exposes its description', () => {
    render(<DisplaySettings />);

    expect(screen.getByRole('radiogroup', { name: 'Display Size' })).toHaveAccessibleDescription(
      /saved on this device only/
    );
  });
});
