import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useCallback, useId, useMemo, useState } from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value: DropdownOption | DropdownOption[] | null;
  onChange: (value: DropdownOption | DropdownOption[] | null) => void;
  isMulti?: boolean;
  isSearchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Dropdown(props: DropdownProps) {
  const {
    label,
    placeholder = 'Please select',
    options,
    value,
    onChange,
    isMulti = false,
    isSearchable = false,
    required = false,
    disabled = false,
    className,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuId = useId();

  const selectedValues = useMemo<DropdownOption[]>(
    () => (value ? (Array.isArray(value) ? value : [value]) : []),
    [value]
  );

  const hasSelection = selectedValues.length > 0;

  const selectedSet = useMemo(
    () => new Set(selectedValues.map((v) => v.value)),
    [selectedValues]
  );

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const emitChange = useCallback(
    (values: DropdownOption[]) => {
      onChange(
        isMulti ? (values.length > 0 ? values : null) : values[0] ?? null
      );
    },
    [onChange, isMulti]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleOptionClick = useCallback(
    (option: DropdownOption) => {
      if (isMulti) {
        const next = selectedSet.has(option.value)
          ? selectedValues.filter((v) => v.value !== option.value)
          : [...selectedValues, option];
        emitChange(next);
      } else {
        emitChange([option]);
        close();
      }
    },
    [isMulti, selectedSet, selectedValues, emitChange, close]
  );

  const handleRemoveChip = useCallback(
    (option: DropdownOption) => {
      emitChange(selectedValues.filter((v) => v.value !== option.value));
    },
    [selectedValues, emitChange]
  );

  return (
    <div className={`relative flex flex-col gap-1 w-full ${className ?? ''}`}>
      {label && (
        <p className="text-sm text-gray-900">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </p>
      )}

      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={[
          'relative flex items-center justify-between gap-2 w-full px-4 rounded-full border bg-white cursor-pointer select-none transition-colors h-12',
          isOpen ? 'border-[#008CEE]' : 'border-gray-200',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          if (!disabled) setIsOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
          }
        }}
      >
        {isMulti && hasSelection ? (
          <div className="absolute inset-0 flex items-center pl-4 pr-10 gap-2">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              {selectedValues.slice(0, 2).map((v) => (
                <span
                  key={v.value}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 text-xs text-gray-700 whitespace-nowrap flex-shrink-0"
                >
                  {v.label}
                  <button
                    type="button"
                    className="w-0 overflow-hidden opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-150 leading-none hover:text-red-500 outline-none focus:outline-none flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveChip(v);
                    }}
                  >
                    <X size={16} />
                  </button>
                </span>
              ))}
            </div>
            {selectedValues.length > 2 && (
              <span className="px-2 py-1 rounded-full bg-gray-200 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                +{selectedValues.length - 2}
              </span>
            )}
          </div>
        ) : (
          <p
            className={`text-sm flex-1 truncate ${
              hasSelection ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {hasSelection ? selectedValues[0].label : placeholder}
          </p>
        )}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-gray-400 z-10 ${
            isOpen ? 'rotate-180' : ''
          } ${isMulti && hasSelection ? 'ml-auto' : ''}`}
        />
      </div>

      {isOpen && (
        <>
          {/* Backdrop — click-outside dismiss */}
          <div className="fixed inset-0 z-40" onClick={close} />

          {/* Menu */}
          <div
            id={menuId}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden"
          >
            {isSearchable && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Search size={16} />
                <input
                  autoFocus
                  type="text"
                  className="flex-1 text-sm bg-transparent text-gray-900 placeholder:text-gray-400 border-none outline-none focus:outline-none focus:ring-0 focus:border-none"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div role="listbox" className="overflow-y-auto max-h-[352px]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const active = selectedSet.has(option.value);
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={active}
                      className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                      {active && <Check size={16} className="flex-shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  No results found
                </div>
              )}
            </div>

            {isMulti && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button
                  type="button"
                  className={`text-sm transition-colors cursor-pointer ${
                    hasSelection
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-300 cursor-default'
                  }`}
                  disabled={!hasSelection}
                  onClick={() => emitChange([])}
                >
                  Clear all
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                  onClick={close}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
