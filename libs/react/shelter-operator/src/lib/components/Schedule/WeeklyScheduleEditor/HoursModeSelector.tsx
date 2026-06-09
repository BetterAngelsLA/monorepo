import { mergeCss } from '@monorepo/react/shared';
import type { HoursMode } from '../types';

type TProps = {
  value: HoursMode;
  onChange: (mode: HoursMode) => void;
};

const OPTIONS: { value: HoursMode; label: string; description: string }[] = [
  {
    value: 'same',
    label: 'Same hours every day',
    description: 'All open days share one time range',
  },
  {
    value: 'mixed',
    label: 'Different hours per day',
    description: 'Set hours individually for each day',
  },
  {
    value: 'closed',
    label: 'Closed all week',
    description: 'No scheduled hours for this period',
  },
];

export function HoursModeSelector(props: TProps) {
  const { value, onChange } = props;

  return (
    <div className="flex gap-3 flex-wrap">
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={mergeCss([
              'flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-colors',
              isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
            ])}
            aria-pressed={isSelected}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-gray-500 mt-0.5">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
