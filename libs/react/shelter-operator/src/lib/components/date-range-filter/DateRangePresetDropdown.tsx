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
   * Emitted on selection, including `CUSTOM` — the caller decides what that
   * means (the composed `DateRangeFilter` opens its calendar). `null` means the
   * active entry was toggled off, which the caller also decides: it widens to
   * `ALL` in a filter that offers "All Time" and is ignored otherwise.
   */
  onChange: (value: DateRangePresetValue | null) => void;
  /** Offer the "All Time" entry, i.e. let the filter be unfiltered. */
  includeAll?: boolean;
  /** Accessible name for the trigger; the control shows no visible label. */
  ariaLabel?: string;
  className?: string;
}

const PRESET_OPTIONS: ReadonlyArray<DropdownOption<DateRangePresetValue>> =
  toDropdownOptions(PRESET_LABELS);

const PRESET_OPTIONS_WITH_ALL: ReadonlyArray<
  DropdownOption<DateRangePresetValue>
> = toDropdownOptions(PRESET_VALUE_LABELS);

/**
 * Selects a shared date-range preset or the Custom entry.
 *
 * Presentational and controlled: it holds no filter state, writes nothing, and
 * assigns no meaning to any value — `CUSTOM` is reported like any other, so a
 * toolbar backed by shared state (reports) and a component with local state
 * (the activity log) can both use it.
 */
export function DateRangePresetDropdown({
  value,
  onChange,
  includeAll = false,
  ariaLabel,
  className,
}: DateRangePresetDropdownProps) {
  const options = includeAll ? PRESET_OPTIONS_WITH_ALL : PRESET_OPTIONS;
  const selected = options.find((option) => option.value === value) ?? null;

  function handleChange(option: DropdownOption<DateRangePresetValue> | null) {
    onChange(option?.value ?? null);
  }

  return (
    <Dropdown<DateRangePresetValue>
      ariaLabel={ariaLabel}
      options={options}
      value={selected}
      onChange={handleChange}
      className={className}
    />
  );
}
