import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, DatePickerField } from './date-picker';

describe('DatePicker', () => {
  it('renders placeholder when no date selected', () => {
    render(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('renders formatted date when selected', () => {
    const date = new Date(2026, 7, 16);
    render(<DatePicker date={date} />);
    expect(screen.getByText(date.toLocaleDateString())).toBeInTheDocument();
  });

  it('closes the popover after selecting a date', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DatePicker onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /pick a date/i }));
    const calendar = screen.getByRole('grid');
    const dayButton = within(calendar)
      .getAllByRole('button')
      .find((button) => button.hasAttribute('data-day') && !button.hasAttribute('disabled'));
    if (!dayButton) throw new Error('Expected an enabled calendar day button');
    await user.click(dayButton);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBeInstanceOf(Date);
    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });
});

describe('DatePickerField', () => {
  it('renders label and picker', () => {
    render(<DatePickerField id="test-date" label="Start date" />);
    expect(screen.getByText('Start date')).toBeInTheDocument();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });
});
