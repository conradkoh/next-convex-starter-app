import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker', () => {
  it('renders formatted date range', () => {
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 0, 31);
    render(<DateRangePicker value={{ startDate: start, endDate: end }} onChange={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Jan 1, 2024 - Jan 31, 2024' });

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Jan 1, 2024 - Jan 31, 2024');
    expect(screen.queryByText('Select date range')).not.toBeInTheDocument();
  });
});
