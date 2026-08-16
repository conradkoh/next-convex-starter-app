'use client';

import { CalendarIcon, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTheme } from '@/modules/theme/ThemeProvider';

function Field({ label, id, type = 'date', value, onChange }: { label: string; id: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} data-native-date-input={type !== 'text' ? true : undefined} /></div>;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent>{children}</CardContent></Card>;
}

export default function DatePickerTestPage() {
  const { theme, setTheme } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [popoverDate, setPopoverDate] = useState<Date>();
  const set = (id: string) => (value: string) => setValues((current) => ({ ...current, [id]: value }));
  const value = (id: string) => values[id] ?? '';
  const wrapped = (field: React.ReactNode) => <div className="ios-date-input-flex">{field}</div>;

  return <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
    <header><h1 className="text-3xl font-bold">Safari Date Picker Test</h1><p className="mt-2 text-muted-foreground">Compare native temporal inputs and custom calendar pickers on Safari and iOS, including dark mode and constrained layouts.</p></header>
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-4"><span className="mr-2 font-medium">Theme:</span><Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}><Sun className="mr-2 size-4" />Light</Button><Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}><Moon className="mr-2 size-4" />Dark</Button><Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button></div>
    <Section title="A. Default width (production pattern)" description="Bare inputs match production forms. Check width, picker icon, and dark-mode overflow."><div className="space-y-4"><Field label="Date" id="default-date" value={value('default-date')} onChange={set('default-date')} /><Field label="Date and time" id="default-datetime" type="datetime-local" value={value('default-datetime')} onChange={set('default-datetime')} /></div></Section>
    <Section title="B. Full width" description="Inputs stretch across a visible full-width parent."><div className="w-full space-y-4 rounded-md border bg-muted/20 p-4"><Field label="Full-width date" id="full-date" value={value('full-date')} onChange={set('full-date')} /><Field label="Full-width time" id="full-time" type="time" value={value('full-time')} onChange={set('full-time')} /></div></Section>
    <Section title="C. Constrained parent (max-w-md)" description="Compare the Safari overflow bug without the wrapper and the flex-wrapper fix."><div className="w-full space-y-4 rounded-md border bg-muted/20 p-4 sm:max-w-md"><Field label="Without ios-date-input-flex" id="constrained-raw" value={value('constrained-raw')} onChange={set('constrained-raw')} />{wrapped(<Field label="With ios-date-input-flex" id="constrained-fixed" value={value('constrained-fixed')} onChange={set('constrained-fixed')} />)}</div></Section>
    <Section title="D. Flex side by side" description="Compare two-field rows with and without the iOS wrapper."><div className="space-y-4"><div className="flex flex-col gap-4 rounded-md border bg-muted/20 p-4 sm:flex-row"><div className="flex-1"><Field label="Start date (raw)" id="flex-raw-start" value={value('flex-raw-start')} onChange={set('flex-raw-start')} /></div><div className="flex-1"><Field label="End date (raw)" id="flex-raw-end" value={value('flex-raw-end')} onChange={set('flex-raw-end')} /></div></div><div className="flex flex-col gap-4 rounded-md border bg-muted/20 p-4 sm:flex-row"><div className="flex-1">{wrapped(<Field label="Start date (fixed)" id="flex-fixed-start" value={value('flex-fixed-start')} onChange={set('flex-fixed-start')} />)}</div><div className="flex-1">{wrapped(<Field label="End date (fixed)" id="flex-fixed-end" value={value('flex-fixed-end')} onChange={set('flex-fixed-end')} />)}</div></div></div></Section>
    <Section title="E. Grid layout (2 columns)" description="Check temporal inputs inside a responsive two-column form grid."><div className="grid grid-cols-1 gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-2">{wrapped(<Field label="Grid date" id="grid-date" value={value('grid-date')} onChange={set('grid-date')} />)}{wrapped(<Field label="Grid time" id="grid-time" type="time" value={value('grid-time')} onChange={set('grid-time')} />)}</div></Section>
    <Section title="F. All native temporal types" description="Test the native date, datetime, time, month, and week controls in dark and light modes."><div className="space-y-4">{(['date', 'datetime-local', 'time', 'month', 'week'] as const).map((type) => wrapped(<Field key={type} label={type} id={`all-${type}`} type={type} value={value(`all-${type}`)} onChange={set(`all-${type}`)} />))}</div></Section>
    <Section title="G. Popover + Calendar picker" description="Custom picker comparison: inspect trigger width, popover placement, and calendar contrast."><div className="space-y-4"><div className="w-full rounded-md border bg-muted/20 p-4"><Label>Full-width calendar</Label><Popover><PopoverTrigger className="mt-2 w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 size-4" />{popoverDate ? popoverDate.toLocaleDateString() : 'Pick a date'}</PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={popoverDate} onSelect={setPopoverDate} /></PopoverContent></Popover></div><div className="w-full rounded-md border bg-muted/20 p-4 sm:max-w-md"><Label>Constrained calendar</Label><Popover><PopoverTrigger className={cn('mt-2 w-full justify-start text-left font-normal', !popoverDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 size-4" />{popoverDate ? popoverDate.toLocaleDateString() : 'Pick a date'}</PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={popoverDate} onSelect={setPopoverDate} /></PopoverContent></Popover></div></div></Section>
  </div>;
}
