import { mergeCss } from '@monorepo/react/shared';
import { useCallback, useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import { DateRangePresetDropdown } from './DateRangePresetDropdown';
import { resolvePresetValue } from './presets';
import type { DateRange, DateRangePresetValue } from './types';

export interface DateRangeFilterProps {
  /** The committed range. */
  value: DateRange;
  /** The preset the committed range is represented by. */
  preset: DateRangePresetValue;
  /**
   * Emitted whenever the filter changes: a preset selection, a committed custom
   * range, or a toggle-off (which empties the range and emits `ALL`).
   */
  onChange: (range: DateRange, preset: DateRangePresetValue) => void;
  /** Offer the "All time" entry, i.e. allow the filter to be cleared. */
  includeAll?: boolean;
  /** Label for the preset dropdown (the picker's fields label themselves). */
  presetLabel?: string;
  className?: string;
  presetClassName?: string;
  pickerClassName?: string;
}

/**
 * Preset dropdown + custom-range calendar, wired together.
 *
 * The two controls are a single interaction: choosing "Custom" opens the
 * calendar, touching a date previews the "Custom" label, and closing without
 * saving reverts the preview. That state is small but easy to get subtly wrong,
 * so it lives here once instead of in every toolbar that filters by date.
 *
 * Controlled: the caller owns `value`/`preset` and decides what a toggle-off
 * means for it (with `includeAll` it reports `ALL`).
 */
export function DateRangeFilter({
  value,
  preset,
  onChange,
  includeAll = false,
  presetLabel,
  className,
  presetClassName,
  pickerClassName,
}: DateRangeFilterProps) {
  const [previewCustom, setPreviewCustom] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setPreviewCustom(true);
    setIsPickerOpen(true);
  }, []);

  // Back to the committed state: no preview, no panel.
  const settle = useCallback(() => {
    setPreviewCustom(false);
    setIsPickerOpen(false);
  }, []);

  const handlePresetChange = useCallback(
    (next: DateRangePresetValue | null) => {
      // The dropdown normally routes CUSTOM to `onCustomSelected`; treat it as
      // the same request so the two paths cannot diverge.
      if (next === 'CUSTOM') {
        openPicker();
        return;
      }

      // The dropdown toggles: re-selecting the active entry clears it. Only a
      // filter that offers "All time" has somewhere to go.
      if (!next) {
        if (!includeAll) {
          return;
        }

        settle();
        onChange(resolvePresetValue('ALL'), 'ALL');
        return;
      }

      settle();
      onChange(resolvePresetValue(next), next);
    },
    [includeAll, onChange, openPicker, settle],
  );

  const handlePickerOpenChange = useCallback((isOpen: boolean) => {
    setIsPickerOpen(isOpen);

    if (!isOpen) {
      // A dismissed calendar must not leave the "Custom" preview behind.
      setPreviewCustom(false);
    }
  }, []);

  const handleCommit = useCallback(
    (range: DateRange) => {
      settle();
      onChange(range, 'CUSTOM');
    },
    [onChange, settle],
  );

  return (
    <div className={mergeCss(['flex flex-wrap items-end gap-3', className])}>
      <DateRangePresetDropdown
        className={presetClassName}
        label={presetLabel}
        includeAll={includeAll}
        value={previewCustom ? 'CUSTOM' : preset}
        onChange={handlePresetChange}
        onCustomSelected={openPicker}
      />

      <DateRangePicker
        className={pickerClassName}
        value={value}
        open={isPickerOpen}
        onOpenChange={handlePickerOpenChange}
        onDirty={() => setPreviewCustom(true)}
        onCommit={handleCommit}
      />
    </div>
  );
}
