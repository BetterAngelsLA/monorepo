import { mergeCss } from '@monorepo/react/shared';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../base-ui/buttons';
import { MenuPanel } from '../base-ui/dropdown/MenuPanel';
import { usePortalPosition } from '../base-ui/dropdown/usePortalPosition';
import { Text } from '../base-ui/text/text';
import { Calendar, type RdpDateRange } from './Calendar';
import type { DateRange } from './types';
import { YearGrid } from './YearGrid';

export interface DateRangeCalendarProps {
  /** The committed range shown in the field and used as the draft's seed. */
  value?: DateRange;
  /** Fired only on Save, with the committed range. */
  onCommit: (range: DateRange) => void;
  /**
   * Fired when the user first edits the draft (clicks a day in the grid),
   * before Save. Lets the toolbar preview "Custom" while editing. The edit is
   * still discarded if the popover closes without Save.
   */
  onDirty?: () => void;
  /** Controlled open state (optional); falls back to internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const EMPTY_LABEL = 'MM/DD/YYYY – MM/DD/YYYY';
const fmt = (date: Date) => format(date, 'MM/dd/yyyy');

function toRdp(range?: DateRange): RdpDateRange | undefined {
  if (!range?.from) return undefined;
  return { from: range.from, to: range.to ?? undefined };
}

function toDomain(range?: RdpDateRange): DateRange {
  return { from: range?.from ?? null, to: range?.to ?? null };
}

function formatRange(range?: RdpDateRange): string {
  if (!range?.from) return EMPTY_LABEL;
  return range.to ? `${fmt(range.from)} – ${fmt(range.to)}` : fmt(range.from);
}

/**
 * Custom-range popover: an input field that opens a two-month calendar. The
 * month/year caption swaps to a year grid. The range is held as a local draft
 * and only committed on Save — Cancel discards it.
 */
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
  const [displayMonth, setDisplayMonth] = useState<Date>(
    () => value?.from ?? new Date()
  );
  const [showYearGrid, setShowYearGrid] = useState(false);
  const openYearGrid = useCallback(() => setShowYearGrid(true), []);

  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  function openPopover() {
    // Seed the draft from the committed value each time the popover opens.
    setDraft(toRdp(value));
    setDisplayMonth(value?.from ?? new Date());
    setShowYearGrid(false);
    setOpen(true);
  }

  function close() {
    setShowYearGrid(false);
    setOpen(false);
  }

  function handleSelect(range: RdpDateRange | undefined) {
    setDraft(range);
    // Any day click means the user is hand-picking a range → preview "Custom".
    onDirty?.();
  }

  function handleSave() {
    onCommit(toDomain(draft));
    close();
  }

  function handleYearSelect(year: number) {
    setDisplayMonth((current) => new Date(year, current.getMonth(), 1));
    setShowYearGrid(false);
  }

  const menuPos = usePortalPosition(anchorRef, open, close, menuRef);

  // While open, the field tracks the live draft; when closed, it reflects the
  // committed value (so a cancelled draft never lingers in the field).
  const fieldRange = open ? draft : toRdp(value);

  return (
    <div className={mergeCss(['relative font-sans', className])}>
      <div ref={anchorRef}>
        <button
          type="button"
          onClick={() => (open ? close() : openPopover())}
          className={mergeCss([
            'flex h-12 w-full items-center justify-between gap-2 rounded-full border bg-white px-4 transition-colors',
            open ? 'border-[#008CEE]' : 'border-gray-200',
          ])}
        >
          <Text
            variant="body"
            className={mergeCss([
              'text-sm',
              fieldRange?.from ? 'text-gray-900' : 'text-gray-400',
            ])}
          >
            {formatRange(fieldRange)}
          </Text>
          <CalendarClock className="h-4 w-4 shrink-0 text-gray-400" />
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
              {showYearGrid ? (
                <YearGrid
                  selectedYear={displayMonth.getFullYear()}
                  onSelect={handleYearSelect}
                  className="w-[18rem]"
                />
              ) : (
                <Calendar
                  selected={draft}
                  onSelect={handleSelect}
                  month={displayMonth}
                  onMonthChange={setDisplayMonth}
                  onMonthLabelClick={openYearGrid}
                />
              )}

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
