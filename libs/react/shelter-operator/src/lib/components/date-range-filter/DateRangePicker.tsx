import { mergeCss } from '@monorepo/react/shared';
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
import { MENU_GAP } from '../base-ui/dropdown/constants';
import { MenuPanel } from '../base-ui/dropdown/MenuPanel';
import { useFloatingPanel } from '../base-ui/popover';
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

export interface DateRangePickerProps {
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

export function DateRangePicker({
  value,
  onCommit,
  onDirty,
  open: openProp,
  onOpenChange,
  className,
}: DateRangePickerProps) {
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
  // Shown when Save is pressed with an invalid or incomplete range. Field-level
  // errors only appear on blur, so the click that closes the popover needs its
  // own explanation.
  const [saveError, setSaveError] = useState<string | null>(null);

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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
      setSaveError(null);
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

  const close = useCallback(
    (restoreFocus = false) => {
      suppressCommitRef.current = true;
      setYearGridSide(null);
      setSaveError(null);
      setOpen(false);
      if (restoreFocus) toggleRef.current?.focus();
    },
    [setOpen],
  );

  function openPopover() {
    setOpen(true);
  }

  // Opening from the toggle (or the controlled `open` prop) should put the
  // keyboard inside the panel. Opening because a date field was focused must
  // not: that would yank focus out of the field the user is typing in.
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    const editingDate =
      active instanceof HTMLInputElement && anchorRef.current?.contains(active);
    if (!editingDate) dialogRef.current?.focus();
  }, [open]);

  // The date fields sit outside the popover, so Escape has to be caught at the
  // document rather than on the panel.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close(true);
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
      setSaveError(null);
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

    // A blur caused by clicking back into the control must not erase the
    // explanation for a Save that is still blocked, so only clear the alert
    // once the range is actually complete. Typing clears it in the change
    // handlers.
    if (result.next?.from && result.next?.to) setSaveError(null);
    setDraft(result.next);
    if (result.next?.from) {
      // Keep the two visible months ordered even when only one endpoint was
      // typed; otherwise a typed start can leave the right pane behind it.
      const [left, right] = defaultMonths(result.next);
      setLeftMonth(left);
      setRightMonth(right);
    }
    if (result.changed) onDirty?.();
  }, [fromText, toText, value, onDirty]);

  // Save re-validates from the fields rather than trusting `draft`: on a real
  // click the blur that commits the typed text may not have run yet, and an
  // invalid value must never fall through to the previously committed range.
  function handleSave() {
    const result = computeFieldCommit(fromText, toText, value);
    setFromError(result.fromError);
    setToError(result.toError);

    if (!result.valid) {
      setSaveError('Enter valid start and end dates.');
      return;
    }
    if (!result.next?.from || !result.next?.to) {
      setSaveError('Select both a start and end date.');
      return;
    }

    setSaveError(null);
    onCommit(toDomain(result.next));
    close(true);
  }

  const openOnFocus = () => {
    if (!open) openPopover();
  };

  const changeFromText = useCallback((text: string) => {
    setFromText(text);
    setSaveError(null);
  }, []);

  const changeToText = useCallback((text: string) => {
    setToText(text);
    setSaveError(null);
  }, []);

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

  const dialogId = useId();

  // Fit the panel inside the viewport and flip it above the trigger when there
  // is more room there; the hook also dismisses it on an external scroll or a
  // window resize.
  const panelPos = useFloatingPanel(anchorRef, menuRef, open, {
    gap: MENU_GAP,
    onClose: close,
  }) ?? { top: 0, left: 0 };

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
          onChange={changeFromText}
          onCommit={commitTyped}
          onOpen={openOnFocus}
        />
        <span className="shrink-0 text-[#676767]">–</span>
        <DateField
          label="End date"
          value={toText}
          invalid={toError}
          onChange={changeToText}
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
          onClick={() => (open ? close(true) : openPopover())}
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
            onClose={() => close()}
            align="left-auto"
            hideBackdrop
          >
            <div
              ref={dialogRef}
              id={dialogId}
              role="dialog"
              aria-label="Select date range"
              tabIndex={-1}
              className="flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto p-3 outline-none"
            >
              {yearGridSide ? (
                renderPane(yearGridSide)
              ) : (
                <div className="flex flex-col gap-3 min-[620px]:flex-row">
                  {renderPane('left')}
                  {renderPane('right')}
                </div>
              )}

              {saveError && (
                <p role="alert" className="text-right text-sm text-red-600">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={() => close(true)}
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
