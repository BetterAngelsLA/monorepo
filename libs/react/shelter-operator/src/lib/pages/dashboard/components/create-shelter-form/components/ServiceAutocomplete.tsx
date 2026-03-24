import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { FieldWrapper } from '../../../../../components/form/FieldWrapper';
import { HELPER_TEXT_CLASS } from '../../../../../components/form/styles';

export interface ServiceAutocompleteOption {
  label: string;
  value: string;
}

interface ServiceAutocompleteProps {
  label: string;
  helperText?: string;
  placeholder: string;
  options: ServiceAutocompleteOption[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  pendingValues?: string[];
  onPendingValuesChange?: (values: string[]) => void;
  creatable?: boolean;
  emptyMessage?: string;
}

type SuggestionItem =
  | { kind: 'option'; option: ServiceAutocompleteOption }
  | { kind: 'create'; label: string };

const normalize = (value: string) => value.trim().toLowerCase();

export function ServiceAutocomplete({
  label,
  helperText,
  placeholder,
  options,
  selectedValues,
  onSelectedValuesChange,
  pendingValues = [],
  onPendingValuesChange,
  creatable = false,
  emptyMessage = 'No matching services',
}: ServiceAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selectedLookup = useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );
  const selectedOptions = useMemo(() => {
    const optionMap = new Map(options.map((option) => [option.value, option]));
    return selectedValues
      .map((value) => optionMap.get(value))
      .filter((option): option is ServiceAutocompleteOption => Boolean(option));
  }, [options, selectedValues]);

  const selectedLabels = useMemo(
    () => new Set(selectedOptions.map((option) => normalize(option.label))),
    [selectedOptions]
  );
  const pendingLookup = useMemo(
    () => new Set(pendingValues.map((value) => normalize(value))),
    [pendingValues]
  );

  const suggestions = useMemo(() => {
    const trimmedQuery = query.trim();
    const normalizedQuery = normalize(trimmedQuery);
    const filteredOptions = options.filter((option) => {
      if (selectedLookup.has(option.value)) {
        return false;
      }

      if (!trimmedQuery) {
        return true;
      }

      return normalize(option.label).includes(normalizedQuery);
    });

    const items: SuggestionItem[] = filteredOptions.map((option) => ({
      kind: 'option',
      option,
    }));

    const hasExactExisting = options.some(
      (option) => normalize(option.label) === normalizedQuery
    );
    if (
      creatable &&
      trimmedQuery &&
      !hasExactExisting &&
      !selectedLabels.has(normalizedQuery) &&
      !pendingLookup.has(normalizedQuery)
    ) {
      items.unshift({ kind: 'create', label: trimmedQuery });
    }

    return items;
  }, [
    creatable,
    options,
    pendingLookup,
    query,
    selectedLabels,
    selectedLookup,
  ]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, suggestions.length]);

  const addSelectedValue = (nextValue: string) => {
    if (selectedLookup.has(nextValue)) {
      return;
    }

    onSelectedValuesChange([...selectedValues, nextValue]);
    setQuery('');
    setIsOpen(true);
  };

  const removeSelectedValue = (nextValue: string) => {
    onSelectedValuesChange(
      selectedValues.filter((value) => value !== nextValue)
    );
  };

  const addPendingValue = (nextLabel: string) => {
    const trimmedLabel = nextLabel.trim();
    if (!trimmedLabel || !onPendingValuesChange) {
      return;
    }

    const normalizedLabel = normalize(trimmedLabel);
    if (
      pendingLookup.has(normalizedLabel) ||
      selectedLabels.has(normalizedLabel)
    ) {
      return;
    }

    onPendingValuesChange([...pendingValues, trimmedLabel]);
    setQuery('');
    setIsOpen(true);
  };

  const removePendingValue = (targetLabel: string) => {
    if (!onPendingValuesChange) {
      return;
    }

    onPendingValuesChange(
      pendingValues.filter(
        (value) => normalize(value) !== normalize(targetLabel)
      )
    );
  };

  const handleSuggestionPick = (item: SuggestionItem) => {
    if (item.kind === 'create') {
      addPendingValue(item.label);
      return;
    }

    addSelectedValue(item.option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) =>
        suggestions.length === 0 ? 0 : (current + 1) % suggestions.length
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) =>
        suggestions.length === 0
          ? 0
          : (current - 1 + suggestions.length) % suggestions.length
      );
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeSuggestion = suggestions[highlightedIndex] ?? suggestions[0];
      if (activeSuggestion) {
        handleSuggestionPick(activeSuggestion);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (
      event.key === 'Backspace' &&
      !query &&
      pendingValues.length > 0 &&
      onPendingValuesChange
    ) {
      onPendingValuesChange(pendingValues.slice(0, -1));
    }
  };

  const showSuggestions =
    isOpen && (suggestions.length > 0 || query.trim().length > 0);

  return (
    <FieldWrapper label={label} htmlFor={inputId} helperText={helperText}>
      <div ref={rootRef} className="relative space-y-2">
        <div
          className={clsx(
            'w-full min-h-[3rem] rounded-lg border border-gray-300 bg-white px-3 py-2',
            'flex flex-wrap items-center gap-2',
            'focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent'
          )}
        >
          {selectedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => removeSelectedValue(option.value)}
              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700"
            >
              <span>{option.label}</span>
              <X size={14} />
            </button>
          ))}

          {pendingValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => removePendingValue(value)}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-blue-400 bg-white px-2 py-0.5 text-sm font-medium text-blue-600"
            >
              <span>{value}</span>
              <X size={14} />
            </button>
          ))}

          <div className="flex min-w-[12rem] flex-1 items-center gap-2">
            <Search size={16} className="shrink-0 text-gray-400" />
            <input
              id={inputId}
              type="text"
              value={query}
              onFocus={() => setIsOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-w-[8rem] flex-1 border-none bg-transparent text-sm text-gray-900 outline-hidden placeholder:text-gray-400"
            />
          </div>
        </div>

        {showSuggestions && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {suggestions.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {suggestions.map((item, index) => {
                  const isActive = index === highlightedIndex;
                  return (
                    <button
                      key={
                        item.kind === 'create'
                          ? `create-${item.label}`
                          : item.option.value
                      }
                      type="button"
                      className={clsx(
                        'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-900 hover:bg-gray-50'
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSuggestionPick(item)}
                    >
                      <span>
                        {item.kind === 'create'
                          ? `Add "${item.label}"`
                          : item.option.label}
                      </span>
                      {item.kind === 'create' ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-blue-500">
                          New
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={clsx(HELPER_TEXT_CLASS, 'px-3 py-2')}>
                {emptyMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
