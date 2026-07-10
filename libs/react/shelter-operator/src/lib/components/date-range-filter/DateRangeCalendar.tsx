import { mergeCss } from '@monorepo/react/shared';
import {
  addMonths,
  format,
  isSameMonth,
  isValid,
  parse,
  startOfMonth,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../base-ui/buttons';
import { MenuPanel } from '../base-ui/dropdown/MenuPanel';
import { usePortalPosition } from '../base-ui/dropdown/usePortalPosition';
import { Calendar, type RdpDateRange } from './Calendar';
import type { DateRange } from './types';
import { YearGrid } from './YearGrid';

export interface DateRangeCalendarProps {
  value?: DateRange;
  onCommit: (range: DateRange) => void;
  onDirty?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

type Side = 'left' | 'right';

const DATE_FORMAT = 'MM/dd/yyyy';
const FIELD_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const MIN_YEAR = 1900;
const fmt = (date: Date) => format(date, DATE_FORMAT);

function toRdp(range?: DateRange): RdpDateRange | undefined {
  if (!range?.from) return undefined;
  return { from: range.from, to: range.to ?? undefined };
}

function toDomain(range?: RdpDateRange): DateRange {
  return { from: range?.from ?? null, to: range?.to ?? null };
}

function parseField(text: string): Date | null {
  const trimmed = text.trim();
  if (!FIELD_PATTERN.test(trimmed)) return null;
  const parsed = parse(trimmed, DATE_FORMAT, new Date());
  if (!isValid(parsed) || parsed.getFullYear() < MIN_YEAR) return null;
  return parsed;
}

function defaultMonths(range?: RdpDateRange): [Date, Date] {
  const left = startOfMonth(range?.from ?? new Date());
  const right =
    range?.to && !isSameMonth(range.to, left)
      ? startOfMonth(range.to)
      : addMonths(left, 1);
  return [left, right];
}

interface DateFieldProps {
  label: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onOpen: () => void;
}

function DateField({
  label,
  value,
  invalid,
  onChange,
  onCommit,
  onOpen,
}: DateFieldProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      aria-invalid={invalid}
      placeholder="MM/DD/YYYY"
      value={value}
      onFocus={onOpen}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit();
      }}
      className={mergeCss([
        'w-[6.5rem] border-0 bg-transparent p-0 text-center text-sm outline-none placeholder:text-gray-400',
        invalid ? 'text-red-600' : 'text-gray-900',
      ])}
    />
  );
}

export function DateRangeCalendar({
  value,
  onCommit,
  onDirty,
  open: openProp,
  onOpenChange,
  className,
}: DateRangeCalendarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const [draft, setDraft] = useState<RdpDateRange | undefined>(() =>
    toRdp(value)
  );
  const [leftMonth, setLeftMonth] = useState<Date>(
    () => defaultMonths(toRdp(value))[0]
  );
  const [rightMonth, setRightMonth] = useState<Date>(
    () => defaultMonths(toRdp(value))[1]
  );
  const [yearGridSide, setYearGridSide] = useState<Side | null>(null);

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromError, setFromError] = useState(false);
  const [toError, setToError] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const src = open ? draft : toRdp(value);
    setFromText(src?.from ? fmt(src.from) : '');
    setToText(src?.to ? fmt(src.to) : '');
    setFromError(false);
    setToError(false);
  }, [open, draft, value]);

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function openPopover() {
    const seeded = toRdp(value);
    const [left, right] = defaultMonths(seeded);
    setDraft(seeded);
    setLeftMonth(left);
    setRightMonth(right);
    setYearGridSide(null);
    setOpen(true);
  }

  function close() {
    setYearGridSide(null);
    setOpen(false);
  }

  const handleSelect = useCallback(
    (range: RdpDateRange | undefined) => {
      setDraft(range);
      onDirty?.();
    },
    [onDirty]
  );

  const commitTyped = useCallback(() => {
    const from = parseField(fromText);
    const to = parseField(toText);
    const fromBad = fromText.trim() !== '' && !from;
    const toBad = toText.trim() !== '' && !to;
    const orderBad = !!from && !!to && from > to;

    setFromError(fromBad || orderBad);
    setToError(toBad || orderBad);
    if (fromBad || toBad || orderBad) return;

    let next: RdpDateRange | undefined;
    if (from && to) next = { from, to };
    else if (from) next = { from, to: undefined };
    else if (to) next = { from: to, to: undefined };
    else next = undefined;

    const committed = toRdp(value);
    const unchanged =
      (next?.from?.getTime() ?? null) === (committed?.from?.getTime() ?? null) &&
      (next?.to?.getTime() ?? null) === (committed?.to?.getTime() ?? null);

    setDraft(next);
    if (from) setLeftMonth(startOfMonth(from));
    if (to) setRightMonth(startOfMonth(to));
    if (!unchanged) onDirty?.();
  }, [fromText, toText, value, onDirty]);

  function handleSave() {
    onCommit(toDomain(draft));
    close();
  }

  const openOnFocus = () => {
    if (!open) openPopover();
  };

  const openLeftYear = useCallback(() => setYearGridSide('left'), []);
  const openRightYear = useCallback(() => setYearGridSide('right'), []);
  const selectLeftYear = useCallback((year: number) => {
    setLeftMonth((current) => new Date(year, current.getMonth(), 1));
    setYearGridSide(null);
  }, []);
  const selectRightYear = useCallback((year: number) => {
    setRightMonth((current) => new Date(year, current.getMonth(), 1));
    setYearGridSide(null);
  }, []);

  const menuPos = usePortalPosition(anchorRef, open, close, menuRef);

  const hasError = fromError || toError;

  const panes = {
    left: {
      month: leftMonth,
      onMonthChange: setLeftMonth,
      openYear: openLeftYear,
      selectYear: selectLeftYear,
    },
    right: {
      month: rightMonth,
      onMonthChange: setRightMonth,
      openYear: openRightYear,
      selectYear: selectRightYear,
    },
  } as const;

  const renderPane = (side: Side) => {
    const pane = panes[side];
    return yearGridSide === side ? (
      <YearGrid
        selectedYear={pane.month.getFullYear()}
        onSelect={pane.selectYear}
        className="w-[18rem]"
      />
    ) : (
      <Calendar
        selected={draft}
        onSelect={handleSelect}
        month={pane.month}
        onMonthChange={pane.onMonthChange}
        onMonthLabelClick={pane.openYear}
      />
    );
  };

  return (
    <div className={mergeCss(['relative font-sans', className])}>
      <div
        ref={anchorRef}
        className={mergeCss([
          'flex h-12 w-full items-center gap-1 rounded-full border bg-white px-4 transition-colors',
          hasError
            ? 'border-red-500'
            : open
              ? 'border-[#008CEE]'
              : 'border-gray-200',
        ])}
      >
        <DateField
          label="Start date"
          value={fromText}
          invalid={fromError}
          onChange={setFromText}
          onCommit={commitTyped}
          onOpen={openOnFocus}
        />
        <span className="shrink-0 text-gray-400">–</span>
        <DateField
          label="End date"
          value={toText}
          invalid={toError}
          onChange={setToText}
          onCommit={commitTyped}
          onOpen={openOnFocus}
        />
        <button
          type="button"
          aria-label="Toggle calendar"
          onClick={() => (open ? close() : openPopover())}
          className="ml-auto shrink-0"
        >
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {open &&
        createPortal(
          <MenuPanel
            menuRef={menuRef}
            menuPos={menuPos}
            onClose={close}
            align="right"
          >
            <div className="flex flex-col gap-4 p-4">
              <div className="flex gap-8">
                {renderPane('left')}
                {renderPane('right')}
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
                <Button variant="primary" onClick={close}>
                  Cancel
                </Button>
                <Button variant="primary" color="blue" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </MenuPanel>,
          document.body
        )}
    </div>
  );
}
