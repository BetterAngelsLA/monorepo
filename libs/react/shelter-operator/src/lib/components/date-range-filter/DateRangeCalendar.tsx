import { mergeCss } from '@monorepo/react/shared';
import { startOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../base-ui/buttons';
import { MenuPanel } from '../base-ui/dropdown/MenuPanel';
import { usePortalPosition } from '../base-ui/dropdown/usePortalPosition';
import { Calendar, type RdpDateRange } from './Calendar';
import {
  computeFieldCommit,
  coupleMonths,
  defaultMonths,
  formatDate,
  maskDateInput,
  toDomain,
  toRdp,
} from './dateRangeCalendarUtils';
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
      autoComplete="off"
      aria-label={label}
      aria-invalid={invalid}
      placeholder="MM/DD/YYYY"
      value={value}
      onFocus={onOpen}
      onChange={(e) => onChange(maskDateInput(e.target.value))}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit();
      }}
      className={mergeCss([
        'w-[6rem] border-0 bg-transparent p-0 text-center text-sm tracking-[-0.02em] outline-none placeholder:text-[#676767]',
        invalid ? 'text-red-600' : 'text-[#676767]',
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
    toRdp(value),
  );
  const [leftMonth, setLeftMonth] = useState<Date>(
    () => defaultMonths(toRdp(value))[0],
  );
  const [rightMonth, setRightMonth] = useState<Date>(
    () => defaultMonths(toRdp(value))[1],
  );
  const [yearGridSide, setYearGridSide] = useState<Side | null>(null);

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromError, setFromError] = useState(false);
  const [toError, setToError] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Seed the draft on every closed->open transition rather than in the toggle
  // handler, so openings driven by the controlled `open` prop (e.g. choosing
  // "Custom" in the preset dropdown) start from the committed range too.
  const wasOpenRef = useRef(false);
  // Set while closing so the blur triggered by moving focus back to the toggle
  // does not report the dismissed edit as dirty.
  const suppressCommitRef = useRef(false);

  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      const seeded = toRdp(value);
      const [left, right] = defaultMonths(seeded);
      setDraft(seeded);
      setLeftMonth(left);
      setRightMonth(right);
      setYearGridSide(null);
      suppressCommitRef.current = false;
    }
    wasOpenRef.current = open;
  }, [open, value]);

  useEffect(() => {
    const src = open ? draft : toRdp(value);
    setFromText(src?.from ? formatDate(src.from) : '');
    setToText(src?.to ? formatDate(src.to) : '');
    setFromError(false);
    setToError(false);
  }, [open, draft, value]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback(() => {
    suppressCommitRef.current = true;
    setYearGridSide(null);
    setOpen(false);
  }, [setOpen]);

  function openPopover() {
    setOpen(true);
  }

  // The date fields sit outside the popover, so Escape has to be caught at the
  // document rather than on the panel.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close]);

  // The control renders no backdrop because its fields have to stay clickable
  // while the popover is open, so outside clicks are detected here instead.
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, close]);

  const handleSelect = useCallback(
    (range: RdpDateRange | undefined) => {
      setDraft(range);
      onDirty?.();
    },
    [onDirty],
  );

  const commitTyped = useCallback(() => {
    if (suppressCommitRef.current) {
      suppressCommitRef.current = false;
      return;
    }

    const result = computeFieldCommit(fromText, toText, value);
    setFromError(result.fromError);
    setToError(result.toError);
    if (!result.valid) return;

    setDraft(result.next);
    if (result.from) setLeftMonth(startOfMonth(result.from));
    if (result.to) setRightMonth(startOfMonth(result.to));
    if (result.changed) onDirty?.();
  }, [fromText, toText, value, onDirty]);

  function handleSave() {
    onCommit(toDomain(draft));
    close();
  }

  const openOnFocus = () => {
    if (!open) openPopover();
  };

  const changeLeftMonth = useCallback((next: Date) => {
    setLeftMonth(next);
    setRightMonth((right) => coupleMonths(next, right, 'left'));
  }, []);
  const changeRightMonth = useCallback((next: Date) => {
    setRightMonth(next);
    setLeftMonth((left) => coupleMonths(next, left, 'right'));
  }, []);

  const openLeftYear = useCallback(() => setYearGridSide('left'), []);
  const openRightYear = useCallback(() => setYearGridSide('right'), []);
  const selectLeftYear = useCallback(
    (year: number) => {
      changeLeftMonth(new Date(year, leftMonth.getMonth(), 1));
      setYearGridSide(null);
    },
    [changeLeftMonth, leftMonth],
  );
  const selectRightYear = useCallback(
    (year: number) => {
      changeRightMonth(new Date(year, rightMonth.getMonth(), 1));
      setYearGridSide(null);
    },
    [changeRightMonth, rightMonth],
  );

  const menuPos = usePortalPosition(anchorRef, open, close, menuRef);

  const dialogId = useId();

  // The panel sizes to its content, so on narrow screens it can extend past the
  // right edge. Measure it and pull it back inside the viewport.
  const [panelLeft, setPanelLeft] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPanelLeft(null);
      return;
    }
    const el = menuRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const next = Math.min(menuPos.left, maxLeft);
    setPanelLeft((prev) => (prev === next ? prev : next));
  }, [open, menuPos.left, yearGridSide, leftMonth, rightMonth]);

  const panelPos = { ...menuPos, left: panelLeft ?? menuPos.left };

  const hasError = fromError || toError;

  const panes = {
    left: {
      endpoint: 'from' as const,
      month: leftMonth,
      onMonthChange: changeLeftMonth,
      openYear: openLeftYear,
      selectYear: selectLeftYear,
    },
    right: {
      endpoint: 'to' as const,
      month: rightMonth,
      onMonthChange: changeRightMonth,
      openYear: openRightYear,
      selectYear: selectRightYear,
    },
  } as const;

  const renderPane = (side: Side) => {
    const pane = panes[side];
    return yearGridSide === side ? (
      <YearGrid
        selectedYear={pane.month.getFullYear()}
        anchorYear={pane.month.getFullYear()}
        onSelect={pane.selectYear}
        className="w-[18rem]"
      />
    ) : (
      <Calendar
        selected={draft}
        onSelect={handleSelect}
        endpoint={pane.endpoint}
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
          'flex h-12 w-full items-center gap-2 rounded-full border bg-white px-5 transition-colors',
          hasError
            ? 'border-red-500'
            : open
              ? 'border-[#008CEE]'
              : 'border-[#E7E7E7]',
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
        <span className="shrink-0 text-[#676767]">–</span>
        <DateField
          label="End date"
          value={toText}
          invalid={toError}
          onChange={setToText}
          onCommit={commitTyped}
          onOpen={openOnFocus}
        />
        <button
          ref={toggleRef}
          type="button"
          aria-label="Toggle calendar"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          onClick={() => (open ? close() : openPopover())}
          className="ml-auto shrink-0"
        >
          <CalendarIcon className="h-6 w-6 text-[#676767]" />
        </button>
      </div>

      {open &&
        createPortal(
          <MenuPanel
            menuRef={menuRef}
            menuPos={panelPos}
            onClose={close}
            align="left-auto"
            hideBackdrop
          >
            <div
              id={dialogId}
              role="dialog"
              aria-label="Select date range"
              className="flex flex-col gap-3 p-3"
            >
              {yearGridSide ? (
                renderPane(yearGridSide)
              ) : (
                <div className="flex gap-3">
                  {renderPane('left')}
                  {renderPane('right')}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={close}
                  className="rounded-lg border-transparent bg-[#EBECEF] text-[#747A82] hover:bg-[#DEE0E4]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  color="blue"
                  onClick={handleSave}
                  className="rounded-lg"
                >
                  Save
                </Button>
              </div>
            </div>
          </MenuPanel>,
          document.body,
        )}
    </div>
  );
}
