'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_UI_SCALE,
  normalizeUiScale,
  UI_SCALE_PRESETS,
} from '@/modules/ui-scale/ui-scale-utils';
import { useUiScale } from '@/modules/ui-scale/UiScaleProvider';

const GRID_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] gap-1.5';
const CARD_HEIGHT = 'min-h-[max(3rem,44px)]';
const CARD_CLASS = `flex ${CARD_HEIGHT} min-w-0 items-center rounded-md border hover:bg-accent/50 has-data-checked:border-primary has-data-checked:bg-accent has-data-checked:hover:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50`;
const LABEL_CLASS =
  'flex flex-1 cursor-pointer items-center self-stretch py-2 pr-1.5 pl-1.5 text-base font-medium whitespace-nowrap tabular-nums';

function DisplaySettingsSkeleton() {
  return (
    <div
      className={GRID_CLASS}
      role="group"
      aria-busy="true"
      aria-label="Loading display size preferences"
    >
      {UI_SCALE_PRESETS.map((preset) => (
        <Skeleton key={preset} className={`${CARD_HEIGHT} rounded-md`} />
      ))}
    </div>
  );
}

export function DisplaySettings() {
  const { isUiScaleReady, uiScale, setUiScale } = useUiScale();

  const handleChange = (value: string) => {
    setUiScale(normalizeUiScale(value));
    // Rescaling reflows the scroll container; keep the focused radio on screen.
    requestAnimationFrame(() => {
      (document.activeElement as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' });
    });
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h2 id="display-size-heading" className="text-xl font-semibold mb-2">
        Display Size
      </h2>
      <p id="display-size-description" className="text-sm text-muted-foreground mb-4">
        Make text and controls larger or smaller across the app. This is saved on this device only.
        The default is 100%.
      </p>

      {!isUiScaleReady || uiScale == null ? (
        <DisplaySettingsSkeleton />
      ) : (
        <RadioGroup
          value={String(uiScale)}
          onValueChange={handleChange}
          aria-labelledby="display-size-heading"
          aria-describedby="display-size-description"
          className={GRID_CLASS}
        >
          {UI_SCALE_PRESETS.map((preset) => (
            <div key={preset} className={CARD_CLASS}>
              <RadioGroupItem
                value={String(preset)}
                id={`display-size-${preset}`}
                className="ml-2"
              />
              <Label htmlFor={`display-size-${preset}`} className={LABEL_CLASS}>
                {preset}%{' '}
                {preset === DEFAULT_UI_SCALE ? <span className="sr-only">(default)</span> : null}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
