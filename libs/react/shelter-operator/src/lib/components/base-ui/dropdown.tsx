import { ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './buttons';

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
  hasFooter?: boolean;
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
    hasFooter = false,
    disabled = false,
    className,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stagedValues, setStagedValues] = useState<DropdownOption[]>([]);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [hoveredChip, setHoveredChip] = useState<string | number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedValues: DropdownOption[] = value
    ? Array.isArray(value)
      ? value
      : [value]
    : [];

  const activeValues = hasFooter ? stagedValues : selectedValues;
  const displayValues = hasFooter ? stagedValues : selectedValues;
  const hasSelection = selectedValues.length > 0;
  const hasDisplayValues = displayValues.length > 0;

  const isSelected = (option: DropdownOption) =>
    activeValues.some((v) => v.value === option.value);

  const baseFiltered = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOptions = [
    ...baseFiltered.filter((o) => isSelected(o)),
    ...baseFiltered.filter((o) => !isSelected(o)),
  ];

  const emitChange = (values: DropdownOption[]) => {
    onChange(isMulti ? (values.length > 0 ? values : null) : values[0] ?? null);
  };

  const handleClose = (reason: 'clickOutside' | 'apply' | 'escape') => {
    if (hasFooter && reason === 'clickOutside') emitChange(stagedValues);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (isMulti) {
      const next = isSelected(option)
        ? activeValues.filter((v) => v.value !== option.value)
        : [...activeValues, option];
      hasFooter
        ? setStagedValues(next)
        : onChange(next.length > 0 ? next : null);
    } else {
      onChange(option);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleRemoveChip = (option: DropdownOption) => {
    if (hasFooter) {
      const next = stagedValues.filter((v) => v.value !== option.value);
      setStagedValues(next);
      emitChange(next);
    } else {
      const next = selectedValues.filter((v) => v.value !== option.value);
      onChange(next.length > 0 ? next : null);
    }
  };

  const updateMenuPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        width: rect.width,
        boxSizing: 'border-box',
        zIndex: 9999,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      if (hasFooter) setStagedValues(selectedValues);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('scroll', updateMenuPosition, true);
      window.addEventListener('resize', updateMenuPosition);
    }
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideTrigger = containerRef.current?.contains(target);
      const clickedInsideMenu = document
        .getElementById('dropdown-menu-portal')
        ?.contains(target);
      if (!clickedInsideTrigger && !clickedInsideMenu) {
        if (isOpen) handleClose('clickOutside');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, stagedValues]);

  useEffect(() => {
    if (isOpen && isSearchable) searchRef.current?.focus();
  }, [isOpen, isSearchable]);

  const menu = (
    <div
      id="dropdown-menu-portal"
      style={menuStyle}
      className="bg-base-100 border border-base-300 rounded-2xl shadow-lg flex flex-col overflow-hidden"
    >
      {isSearchable && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-base-200">
          <Search size={16} />
          <input
            ref={searchRef}
            type="text"
            className="flex-1 text-sm bg-transparent text-base-content placeholder:text-base-content/40 border-none outline-none focus:outline-none focus:ring-0 focus:border-none"
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="overflow-y-auto" style={{ maxHeight: '352px' }}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <p
              key={option.value}
              role="option"
              aria-selected={isSelected(option)}
              className={[
                'px-4 py-3 text-sm cursor-pointer transition-colors',
                isSelected(option)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-base-content hover:bg-base-200',
              ].join(' ')}
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </p>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-base-content/40 text-center">
            No results found
          </p>
        )}
      </div>

      {hasFooter && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-base-200 bg-base-100">
          <Button
            variant="smalldark"
            leftIcon={false}
            rightIcon={false}
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => setStagedValues([])}
          >
            Unselect All
          </Button>
          <Button
            variant="floating-light"
            leftIcon={false}
            rightIcon={false}
            style={{
              fontSize: '13px',
              padding: '6px 14px',
            }}
            onClick={() => {
              emitChange(stagedValues);
              handleClose('apply');
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-1 w-full ${className ?? ''}`}
    >
      {label && (
        <p className="text-sm text-base-content">
          {label} <span className="text-error">*</span>
        </p>
      )}

      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        style={{ borderColor: isOpen ? '#008CEE' : '#e5e7eb' }}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updateMenuPosition();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') handleClose('escape');
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isOpen) {
              updateMenuPosition();
              setIsOpen(true);
            }
          }
        }}
        className={[
          'relative flex items-center justify-between gap-2 w-full px-4 rounded-full border bg-base-100 cursor-pointer select-none transition-colors h-12',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isMulti && hasDisplayValues ? (
          <div
            className="absolute inset-0 flex items-center pl-4 pr-8"
            style={{ overflow: 'hidden' }}
          >
            <div
              className="flex items-center gap-2"
              style={{
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                width: '100%',
              }}
            >
              {displayValues.map((v, index) => (
                <span
                  key={v.value}
                  style={{ backgroundColor: '#e5e7eb', flexShrink: 0 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-gray-700 whitespace-nowrap"
                  onMouseEnter={() => setHoveredChip(v.value)}
                  onMouseLeave={() => setHoveredChip(null)}
                >
                  {v.label}
                  <button
                    type="button"
                    style={{
                      opacity: hoveredChip === v.value ? 1 : 0,
                      width: hoveredChip === v.value ? '16px' : '0px',
                      transition: 'opacity 0.15s, width 0.15s',
                      overflow: 'hidden',
                    }}
                    className="leading-none hover:text-red-500 outline-none focus:outline-none flex-shrink-0"
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
          </div>
        ) : (
          <p
            className={`text-sm flex-1 truncate ${
              hasSelection ? 'text-base-content' : 'text-base-content/40'
            }`}
          >
            {hasSelection ? selectedValues[0].label : placeholder}
          </p>
        )}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-base-content/60 z-10 ${
            isOpen ? 'rotate-180' : ''
          } ${isMulti && hasDisplayValues ? 'ml-auto' : ''}`}
        />
      </div>

      {isOpen && createPortal(menu, document.body)}
    </div>
  );
}

export default Dropdown;
