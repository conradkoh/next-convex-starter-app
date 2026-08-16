'use client';
import { CalendarIcon, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTheme } from '@/modules/theme/ThemeProvider';

type PickerKind = 'native' | 'custom';
type VariantIssue = {
  layoutKey: string;
  wrapKey?: string;
  kindKey?: PickerKind;
  severity: 'do-not-use' | 'known-issue';
  message: string;
};
type WrapOption = { key: string; label: string; wrapInput: boolean };
type Layout = {
  key: string;
  title: string;
  description: string;
  className: string;
  twoFields?: boolean;
};
const variantIssues: VariantIssue[] = [
  {
    layoutKey: 'full',
    wrapKey: 'raw',
    kindKey: 'native',
    severity: 'do-not-use',
    message: 'Do not use — iOS Safari dark mode does not respect this width.',
  },
  {
    layoutKey: 'constrained',
    wrapKey: 'raw',
    kindKey: 'native',
    severity: 'do-not-use',
    message: 'Do not use — iOS Safari dark mode does not respect this width.',
  },
];
const getVariantIssue = (layoutKey: string, wrapKey: string | undefined, kindKey: PickerKind) =>
  variantIssues.find(
    (issue) =>
      issue.layoutKey === layoutKey &&
      (issue.wrapKey === undefined || issue.wrapKey === wrapKey) &&
      (issue.kindKey === undefined || issue.kindKey === kindKey)
  );
const layouts: Layout[] = [
  {
    key: 'default',
    title: 'Default width (production pattern)',
    description: 'Bare form fields with no width constraint — matches BuyForm.',
    className: 'space-y-4',
  },
  {
    key: 'full',
    title: 'Full width',
    description: 'Inputs stretch across a visible full-width parent.',
    className: 'w-full space-y-4 rounded-md border bg-muted/20 p-4',
  },
  {
    key: 'constrained',
    title: 'Constrained parent (max-w-md)',
    description: 'Parent capped at max-w-md — key Safari overflow scenario.',
    className: 'w-full space-y-4 rounded-md border bg-muted/20 p-4 sm:max-w-md',
  },
  {
    key: 'flex',
    title: 'Flex side by side',
    description: 'Two date fields in a flex row (forced on mobile for harness testing).',
    className: 'flex flex-row flex-wrap gap-4 rounded-md border bg-muted/20 p-4',
    twoFields: true,
  },
  {
    key: 'grid',
    title: 'Grid layout (2 columns)',
    description: 'Two fields in a 2-column grid (forced on mobile for harness testing).',
    className: 'grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4',
    twoFields: true,
  },
];
const wraps: WrapOption[] = [
  { key: 'raw', label: 'Native · no flex wrapper', wrapInput: false },
  { key: 'flex', label: 'Native · ios-date-input-flex', wrapInput: true },
];
const kinds: { key: PickerKind; label: string }[] = [
  { key: 'native', label: 'Native temporal input' },
  { key: 'custom', label: 'Custom · Popover + Calendar' },
];

function Field({
  id,
  label,
  type = 'date',
  value,
  onChange,
  wrapInput = false,
  showState = false,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  wrapInput?: boolean;
  showState?: boolean;
}) {
  const input = (
    <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  );
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {wrapInput ? <div className="ios-date-input-flex">{input}</div> : input}
      {showState && (
        <p className="font-mono text-xs text-muted-foreground">
          state: {value === '' ? '""' : JSON.stringify(value)}
        </p>
      )}
    </div>
  );
}
function CustomDateField({
  id,
  label,
  date,
  onSelect,
}: {
  id: string;
  label: string;
  date?: Date;
  onSelect: (d?: Date) => void;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="min-h-9">
        <Popover modal>
          <PopoverTrigger
            id={id}
            className={cn(
              'mt-0 flex h-9 w-full items-center rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {date ? date.toLocaleDateString() : 'Pick a date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={onSelect} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function VariantBlock({
  label,
  issue,
  children,
}: {
  label: string;
  issue?: VariantIssue;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'space-y-2 rounded-md',
        issue?.severity === 'do-not-use' && 'border-2 border-destructive/50 bg-destructive/5 p-3'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {issue?.severity === 'do-not-use' && <Badge variant="destructive">DO NOT USE</Badge>}
      </div>
      {issue && <p className="text-xs text-destructive">{issue.message}</p>}
      {children}
    </div>
  );
}

export default function DatePickerTestPage() {
  const { theme, setTheme } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [customDates, setCustomDates] = useState<Record<string, Date | undefined>>({});
  const setValue = (id: string) => (v: string) => setValues((s) => ({ ...s, [id]: v }));
  const setDate = (id: string) => (v?: Date) => setCustomDates((s) => ({ ...s, [id]: v }));
  const renderFields = (layout: Layout, prefix: string, wrapInput: boolean, showState = false) =>
    layout.twoFields ? (
      <>
        <Field
          id={`${prefix}-start`}
          label="Start date"
          value={values[`${prefix}-start`] ?? ''}
          onChange={setValue(`${prefix}-start`)}
          wrapInput={wrapInput}
          showState={showState}
        />
        <Field
          id={`${prefix}-end`}
          label="End date"
          value={values[`${prefix}-end`] ?? ''}
          onChange={setValue(`${prefix}-end`)}
          wrapInput={wrapInput}
          showState={showState}
        />
      </>
    ) : (
      <Field
        id={`${prefix}-date`}
        label="Date"
        value={values[`${prefix}-date`] ?? ''}
        onChange={setValue(`${prefix}-date`)}
        wrapInput={wrapInput}
        showState={showState}
      />
    );
  const renderCustom = (layout: Layout) =>
    layout.twoFields ? (
      <>
        <CustomDateField
          id={`${layout.key}-custom-start`}
          label="Start date"
          date={customDates[`${layout.key}-custom-start`]}
          onSelect={setDate(`${layout.key}-custom-start`)}
        />
        <CustomDateField
          id={`${layout.key}-custom-end`}
          label="End date"
          date={customDates[`${layout.key}-custom-end`]}
          onSelect={setDate(`${layout.key}-custom-end`)}
        />
      </>
    ) : (
      <CustomDateField
        id={`${layout.key}-custom-date`}
        label="Date"
        date={customDates[`${layout.key}-custom-date`]}
        onSelect={setDate(`${layout.key}-custom-date`)}
      />
    );
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">Safari Date Picker Test</h1>
        <p className="mt-2 text-muted-foreground">
          Compare native temporal inputs and custom calendar pickers on Safari and iOS, including
          dark mode and constrained layouts.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-4">
        <span className="mr-2 font-medium">Theme:</span>
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          onClick={() => setTheme('light')}
        >
          <Sun className="mr-2 size-4" />
          Light
        </Button>
        <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
          <Moon className="mr-2 size-4" />
          Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          onClick={() => setTheme('system')}
        >
          System
        </Button>
      </div>
      <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-xl font-semibold text-destructive">Known Issues (iOS Safari)</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong>Full width / Constrained parent without ios-date-input-flex:</strong> iOS Safari
            dark mode does not respect width — flagged below as DO NOT USE.
          </li>
          <li>
            <strong>Side-by-side layouts:</strong> Forced side-by-side in flex/grid sections for
            mobile testing.
          </li>
          <li>
            <strong>Native temporal alignment:</strong> Selection may not be centered
            vertically/horizontally.
          </li>
          <li>
            <strong>Custom date picker popover:</strong> Check custom sections for parent height
            changes when opening.
          </li>
          <li>
            <strong>Native auto-selection:</strong> Compare visual display with{' '}
            <code className="font-mono text-xs">state:</code> readout.
          </li>
        </ul>
      </div>
      {layouts.map((layout) => (
        <Section key={layout.key} title={layout.title} description={layout.description}>
          <div className="space-y-6">
            {kinds.map((kind) =>
              kind.key === 'native' ? (
                wraps.map((wrap) => (
                  <VariantBlock
                    key={`${layout.key}-${wrap.key}`}
                    label={wrap.label}
                    issue={getVariantIssue(layout.key, wrap.key, 'native')}
                  >
                    <div className={layout.className}>
                      {renderFields(layout, `${layout.key}-${wrap.key}`, wrap.wrapInput)}
                    </div>
                  </VariantBlock>
                ))
              ) : (
                <VariantBlock key={`${layout.key}-custom`} label={kind.label}>
                  <div className={layout.className}>{renderCustom(layout)}</div>
                </VariantBlock>
              )
            )}
          </div>
        </Section>
      ))}
      <Section
        title="All native temporal types"
        description="Native-only: date, datetime-local, time, month, week — no custom picker equivalent."
      >
        {wraps.map((wrap) => (
          <VariantBlock key={wrap.key} label={wrap.label}>
            <div className="space-y-4">
              {(['date', 'datetime-local', 'time', 'month', 'week'] as const).map((type) => (
                <Field
                  key={type}
                  id={`temporal-${wrap.key}-${type}`}
                  label={type}
                  type={type}
                  value={values[`temporal-${wrap.key}-${type}`] ?? ''}
                  onChange={setValue(`temporal-${wrap.key}-${type}`)}
                  wrapInput={wrap.wrapInput}
                  showState
                />
              ))}
            </div>
          </VariantBlock>
        ))}
      </Section>
    </div>
  );
}
