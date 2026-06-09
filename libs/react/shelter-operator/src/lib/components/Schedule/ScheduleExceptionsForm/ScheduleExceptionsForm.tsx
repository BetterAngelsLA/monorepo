import { Plus } from 'lucide-react';
import { useCallback } from 'react';
import type { ExceptionEntry } from '../types';
import { ExceptionRow } from './ExceptionRow';
import { buildDefaultExceptionEntry } from './utils';

type TProps = {
  value: ExceptionEntry[];
  onChange: (next: ExceptionEntry[]) => void;
};

export function ScheduleExceptionsForm(props: TProps) {
  const { value, onChange } = props;

  const addException = useCallback(() => {
    onChange([...value, buildDefaultExceptionEntry()]);
  }, [value, onChange]);

  const updateException = useCallback(
    (localId: string, patch: Partial<ExceptionEntry>) => {
      onChange(
        value.map((e) => (e.localId === localId ? { ...e, ...patch } : e))
      );
    },
    [value, onChange]
  );

  const removeException = useCallback(
    (localId: string) => {
      onChange(value.filter((e) => e.localId !== localId));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Exceptions</h4>

      {value.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No exceptions configured.
        </p>
      )}

      {value.map((entry) => (
        <ExceptionRow
          key={entry.localId}
          entry={entry}
          onChange={(patch) => updateException(entry.localId, patch)}
          onRemove={() => removeException(entry.localId)}
        />
      ))}

      <button
        type="button"
        onClick={addException}
        className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium"
      >
        <Plus size={15} />
        Add exception
      </button>
    </div>
  );
}
