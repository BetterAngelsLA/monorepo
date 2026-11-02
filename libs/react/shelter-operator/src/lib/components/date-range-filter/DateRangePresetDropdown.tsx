import {
  Dropdown,
  toDropdownOptions,
  type DropdownOption,
} from '../base-ui/dropdown';
import { PRESET_LABELS, PRESET_VALUE_LABELS } from './presets';
import type { DateRangePresetValue } from './types';

export interface DateRangePresetDropdownProps {
  /** The preset the filter currently shows (`CUSTOM` while a range previews). */
  value: DateRangePresetValue;
  /**
   * Emitted on selection. `null` means the active entry was toggled off, which
   * the caller decides whether to honour (it widens to `ALL` in a filter that
   * offers "All time", and is ignored otherwise).
   */
  onChange: (value: DateRangePresetValue | null) => void;
  /** Called instead of `onChange` when the user asks for a custom range. */
  onCustomSelected?: () => void;
  /** Offer the "All time" entry, i.e. let the filter be unfiltered. */
  includeAll?: boolean;
  label?: string;
  className?: string;
}

const PRESET_OPTIONS: ReadonlyArray<DropdownOption<DateRangePresetValue>> =
  toDropdownOptions(PRESET_LABELS);

const PRESET_OPTIONS_WITH_ALL: ReadonlyArray<
  DropdownOption<DateRangePresetValue>
> = toDropdownOptions(PRESET_VALUE_LABELS);

/**
 * Selects a shared date-range preset, or asks for a custom range.
 *
 * Presentational and controlled: it holds no filter state and writes nothing
 * itself, so a toolbar backed by shared state (reports) and a component with
 * local state (the activity log) can both use it.
 */
export function DateRangePresetDropdown({
  value,
  onChange,
  onCustomSelected,
  includeAll = false,
  label,
  className,
}: DateRangePresetDropdownProps) {
  const options = includeAll ? PRESET_OPTIONS_WITH_ALL : PRESET_OPTIONS;
  const selected = options.find((option) => option.value === value) ?? null;

  function handleChange(option: DropdownOption<DateRangePresetValue> | null) {
    if (!option) {
      onChange(null);
      return;
    }

    if (option.value === 'CUSTOM') {
      onCustomSelected?.();
      return;
    }

    onChange(option.value);
  }

  return (
    <Dropdown<DateRangePresetValue>
      label={label}
      options={options}
      value={selected}
      onChange={handleChange}
      className={className}
    />
  );
}
