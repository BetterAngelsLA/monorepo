import { useAtom } from 'jotai';
import { Dropdown, toDropdownOptions, toDropdownValue } from '../base-ui/dropdown';
import type { DropdownOption } from '../base-ui/dropdown';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { PRESET_LABELS, resolvePreset } from './presets';
import type { DateRangePreset } from './types';

export interface DateRangePresetDropdownProps {
  /**
   * Called when the user picks "Custom". The toolbar opens the calendar in
   * response; the atom's range is committed later, on Save. The atom preset is
   * intentionally not changed here.
   */
  onCustomSelected?: () => void;
  /**
   * Preset to show as selected, overriding the committed atom value. The
   * toolbar uses it to preview "Custom" while the user edits an uncommitted
   * calendar draft. Display-only — it does not change what selecting an option
   * does.
   */
  displayPreset?: DateRangePreset;
  className?: string;
}

// Order follows PRESET_LABELS' key order (CUSTOM last — it opens the calendar).
const OPTIONS = toDropdownOptions(PRESET_LABELS);

/**
 * Presets dropdown wired to the shared filter atom. Picking a named preset
 * resolves its range and writes the atom (one source of truth); picking
 * "Custom" defers to the toolbar to open the calendar.
 */
export function DateRangePresetDropdown({
  onCustomSelected,
  displayPreset,
  className,
}: DateRangePresetDropdownProps) {
  const [filter, setFilter] = useAtom(dateRangeFilterAtom);

  const value = toDropdownValue(displayPreset ?? filter.preset, PRESET_LABELS);

  function handleChange(option: DropdownOption<DateRangePreset> | null) {
    // Re-clicking the active option clears the selection; keep the current
    // filter rather than emptying it.
    if (!option) return;

    if (option.value === 'CUSTOM') {
      onCustomSelected?.();
      return;
    }

    setFilter({
      preset: option.value,
      range: resolvePreset(option.value),
    });
  }

  return (
    <Dropdown<DateRangePreset>
      options={OPTIONS}
      value={value}
      onChange={handleChange}
      className={className}
    />
  );
}
