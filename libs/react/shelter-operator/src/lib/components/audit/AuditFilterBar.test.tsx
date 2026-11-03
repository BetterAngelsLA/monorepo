import { MockedProvider } from '@apollo/client/testing/react';
import { AuditTargetType } from '@monorepo/ba-platform/types';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { useState } from 'react';
import type { DateRange, DateRangePresetValue } from '../date-range-filter';
import { resolvePresetValue } from '../date-range-filter';
import { AuditFilterBar } from './AuditFilterBar';
import type { AuditActorSelection } from './auditFilters';
import { AuditActorsDocument } from '../../hooks/useAuditActors/__generated__/useAuditActors.generated';

// jsdom has no ResizeObserver; the preset dropdown measures its anchor on open.
class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

const PINNED_NOW = new Date(2026, 5, 15, 12, 0, 0);

beforeEach(() => {
  vi.setSystemTime(PINNED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const actorVariables = (search: string) => ({
  targetType: AuditTargetType.Bed,
  objectId: '7',
  search,
  limit: 20,
});

function actorMock(search: string, calls?: string[]) {
  return {
    request: {
      query: AuditActorsDocument,
      variables: actorVariables(search),
    },
    result: () => {
      calls?.push(search);
      return {
        data: {
          objectAuditActors: [
            {
              __typename: 'AuditActorType',
              id: 'user-1',
              label: 'Ada Lovelace',
              isSystem: false,
            },
          ],
        },
      };
    },
  };
}

function systemActorMock(search: string) {
  return {
    request: {
      query: AuditActorsDocument,
      variables: actorVariables(search),
    },
    result: () => ({
      data: {
        objectAuditActors: [
          {
            __typename: 'AuditActorType',
            id: null,
            label: 'System',
            isSystem: true,
          },
        ],
      },
    }),
  };
}

type HarnessProps = {
  mocks?: ReadonlyArray<unknown>;
  onChange?: (filters: unknown) => void;
  initialPreset?: DateRangePresetValue;
  initialRange?: DateRange;
};

/** Renders the bar as a caller does: it owns the committed actor selection. */
function Harness({
  mocks = [],
  onChange = () => undefined,
  initialPreset,
  initialRange,
}: HarnessProps) {
  const [actorSelection, setActorSelection] =
    useState<AuditActorSelection | null>(null);

  return (
    <MockedProvider mocks={mocks as never} showWarnings={false}>
      <AuditFilterBar
        targetType={AuditTargetType.Bed}
        objectId="7"
        initialPreset={initialPreset}
        initialRange={initialRange}
        actorSelection={actorSelection}
        onActorSelectionChange={setActorSelection}
        onChange={onChange}
      />
    </MockedProvider>
  );
}

function renderBar(props: HarnessProps = {}) {
  return render(<Harness {...props} />);
}

/** The preset trigger is named for assistive tech; the actor search is the other. */
function datePreset() {
  return screen.getByRole('combobox', { name: 'Date range' });
}

function dateInput(label: string) {
  return screen.getByLabelText(label);
}

async function selectActor(term: string, name: string) {
  const input = screen.getByPlaceholderText('Search actors');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: term } });
  fireEvent.click(await screen.findByRole('option', { name }));
}

describe('AuditFilterBar', () => {
  it('opens on the shared default preset without re-emitting it', () => {
    const onChange = vi.fn();
    renderBar({ onChange });

    // The caller seeds its own filter state from the same default, so the bar
    // must not emit a second copy (that would issue a duplicate first query).
    expect(datePreset().textContent).toContain('Last 30 Days');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('displays the seeded preset and range without re-emitting', () => {
    const onChange = vi.fn();
    const initialRange = resolvePresetValue('LAST_7_DAYS');

    renderBar({ onChange, initialPreset: 'LAST_7_DAYS', initialRange });

    expect(datePreset().textContent).toContain('Last 7 Days');
    expect(
      (screen.getByLabelText('Start date') as HTMLInputElement).value,
    ).not.toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies a shared preset range as day-aligned bounds', async () => {
    const onChange = vi.fn();
    renderBar({ onChange });

    fireEvent.click(datePreset());
    fireEvent.click(await screen.findByText('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: startOfDay(subDays(PINNED_NOW, 6)).toISOString(),
        dateTo: endOfDay(PINNED_NOW).toISOString(),
      }),
    );
  });

  it('treats re-selecting the active preset as clearing the filter', async () => {
    const onChange = vi.fn();
    renderBar({ onChange });

    fireEvent.click(datePreset());
    // The trigger also reads "Last 30 Days"; the menu item is the later node
    // (the menu is portalled to the end of the document).
    const options = await screen.findAllByText('Last 30 Days');
    fireEvent.click(options[options.length - 1]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: null, dateTo: null }),
    );
    expect(datePreset().textContent).toContain('All Time');
  });

  it('opens the shared date picker for a custom range', async () => {
    renderBar();

    fireEvent.click(datePreset());
    fireEvent.click(await screen.findByText('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
  });

  it('re-opens the calendar instead of clearing a committed custom range', async () => {
    const onChange = vi.fn();
    renderBar({ onChange });

    fireEvent.click(datePreset());
    fireEvent.click(await screen.findByText('Custom'));
    fireEvent.change(dateInput('Start date'), {
      target: { value: '06/01/2026' },
    });
    fireEvent.change(dateInput('End date'), {
      target: { value: '06/15/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onChange).toHaveBeenCalledTimes(1);

    // Re-selecting the Custom entry must offer the dates back for editing, not
    // reset the filter to All Time.
    fireEvent.click(datePreset());
    const options = await screen.findAllByText('Custom');
    fireEvent.click(options[options.length - 1]);

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('emits the committed custom range as day-aligned bounds', async () => {
    const onChange = vi.fn();
    renderBar({ onChange });

    fireEvent.click(datePreset());
    fireEvent.click(await screen.findByText('Custom'));

    fireEvent.change(dateInput('Start date'), {
      target: { value: '06/01/2026' },
    });
    fireEvent.change(dateInput('End date'), {
      target: { value: '06/15/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onChange).toHaveBeenCalledWith({
      dateFrom: startOfDay(new Date(2026, 5, 1)).toISOString(),
      dateTo: endOfDay(new Date(2026, 5, 15)).toISOString(),
    });
    expect(datePreset().textContent).toContain('Custom');
  });

  it('queries actors only after two debounced characters', async () => {
    const calls: string[] = [];
    renderBar({ mocks: [actorMock('', calls), actorMock('ad', calls)] });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });
    expect(calls).toHaveLength(0);

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(calls).toHaveLength(0);

    fireEvent.change(input, { target: { value: 'ad' } });
    await waitFor(() => expect(calls).toEqual(['ad']));
    expect(await screen.findByText('Ada Lovelace')).not.toBeNull();
  });

  it('only names the listbox while it is open', () => {
    renderBar();

    const input = screen.getByPlaceholderText('Search actors');
    expect(input.getAttribute('aria-controls')).toBeNull();

    fireEvent.focus(input);

    const controls = input.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).not.toBeNull();
  });

  it('reports a failed actor search and retries it', async () => {
    const onChange = vi.fn();
    const failure = {
      request: {
        query: AuditActorsDocument,
        variables: actorVariables('ad'),
      },
      error: new Error('network down'),
    };

    renderBar({ mocks: [failure, actorMock('ad')], onChange });

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ad' } });

    // A failed lookup must not be reported as "this object has no actors".
    expect(await screen.findByText(/Couldn.t load actors/)).not.toBeNull();
    expect(screen.queryByText('No actors found.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('option', { name: 'Ada Lovelace' }),
    ).not.toBeNull();
  });

  it('selects a searched actor with the keyboard', async () => {
    const onChange = vi.fn();

    renderBar({ mocks: [actorMock('ad')], onChange });

    const input = screen.getByPlaceholderText('Search actors');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ad' } });

    const option = await screen.findByRole('option', {
      name: 'Ada Lovelace',
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(option.getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
  });

  it('applies and clears the selected actor', async () => {
    const onChange = vi.fn();

    renderBar({ mocks: [actorMock('ad')], onChange });

    await selectActor('ad', 'Ada Lovelace');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
    expect(screen.queryByPlaceholderText('Search actors')).toBeNull();
    expect(screen.getByText('Ada Lovelace')).not.toBeNull();

    fireEvent.click(screen.getByLabelText('Clear actor filter'));

    const cleared = onChange.mock.calls.at(-1)?.[0];
    expect(cleared).not.toHaveProperty('actorId');
    expect(cleared).not.toHaveProperty('systemOnly');
    expect(screen.getByPlaceholderText('Search actors')).not.toBeNull();
  });

  it('filters system events when the system actor is selected', async () => {
    const onChange = vi.fn();

    renderBar({ mocks: [systemActorMock('sys')], onChange });

    await selectActor('sys', 'System');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ systemOnly: true }),
    );
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('actorId');
    expect(screen.getByText('System')).not.toBeNull();
  });

  it('keeps the selected actor when the date range changes', async () => {
    const onChange = vi.fn();

    renderBar({ mocks: [actorMock('ad')], onChange });

    await selectActor('ad', 'Ada Lovelace');

    // The two dimensions are independent: a new range is emitted together with
    // the actor still in effect, not in place of it.
    fireEvent.click(datePreset());
    fireEvent.click(await screen.findByText('Last 7 Days'));

    expect(onChange.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        actorId: 'user-1',
        dateFrom: startOfDay(subDays(PINNED_NOW, 6)).toISOString(),
        dateTo: endOfDay(PINNED_NOW).toISOString(),
      }),
    );

    // ...and clearing the actor keeps the range that is on screen.
    fireEvent.click(screen.getByLabelText('Clear actor filter'));

    const cleared = onChange.mock.calls.at(-1)?.[0];
    expect(cleared).not.toHaveProperty('actorId');
    expect(cleared).toEqual(
      expect.objectContaining({
        dateFrom: startOfDay(subDays(PINNED_NOW, 6)).toISOString(),
        dateTo: endOfDay(PINNED_NOW).toISOString(),
      }),
    );
  });
});
