import { Calendar, type LucideIcon } from 'lucide-react';

export type ComponentHarnessStatus = 'stable' | 'experimental';

export type ComponentHarness = {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badges?: string[];
  status?: ComponentHarnessStatus;
  bestPractices: string[];
  practicesToAvoid: string[];
};

export const componentHarnesses: ComponentHarness[] = [
  {
    path: '/developer/components/date-picker',
    title: 'Date Picker Layouts',
    description:
      'Safari/iOS visual harness for custom Popover+Calendar pickers and native temporal inputs (native marked DO NOT USE). Tests form layouts in light and dark mode.',
    icon: Calendar,
    badges: ['Safari', 'iOS', 'Dark Mode'],
    status: 'experimental',
    bestPractices: [
      'Use DatePickerField from @/components/ui/date-picker (Popover + Calendar).',
      'Prefer modal popover; avoid native temporal inputs entirely.',
      'Test constrained parents (max-w-md) and side-by-side layouts on iOS Safari.',
    ],
    practicesToAvoid: [
      'Native HTML temporal inputs (date, datetime-local, time, month, week) — width, alignment, and auto-selection bugs on iOS Safari.',
      'Assuming ios-date-input-flex fully fixes native input width in dark mode.',
    ],
  },
];
