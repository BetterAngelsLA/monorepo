import { useAtom } from 'jotai';
import { Dropdown, toDropdownOptions, toDropdownValue } from '../base-ui/dropdown';
import type { DropdownOption } from '../base-ui/dropdown';
import { dateRangeFilterAtom } from './dateRangeFilterAtom';
import { PRESET_LABELS, resolvePreset } from './presets';
import type { DateRangePreset } from './types';

export interface DateRangePresetDropdownProps {
  onCustomSelected?: () => void;
  displayPreset?: DateRangePreset;
  className?: string;
}

const OPTIONS = toDropdownOptions(PRESET_LABELS);

export function DateRangePresetDropdown({
  onCustomSelected,
  displayPreset,
  className,
}: DateRangePresetDropdownProps) {
  const [filter, setFilter] = useAtom(dateRangeFilterAtom);

  const value = toDropdownValue(displayPreset ?? filter.preset, PRESET_LABELS);

  function handleChange(option: DropdownOption<DateRangePreset> | null) {
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
