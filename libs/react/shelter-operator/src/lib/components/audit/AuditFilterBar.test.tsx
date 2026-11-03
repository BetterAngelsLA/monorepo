import { fireEvent, render, screen } from '@testing-library/react';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { AuditFilterBar } from './AuditFilterBar';

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

function renderBar(onChange: (filters: unknown) => void = () => undefined) {
  return render(<AuditFilterBar onChange={onChange} />);
}

function dateInput(label: string) {
  return screen.getByLabelText(label);
}

describe('AuditFilterBar', () => {
  it('opens on the shared default preset without re-emitting it', () => {
    const onChange = vi.fn();
    renderBar(onChange);

    // The caller seeds its own filter state from the same default, so the bar
    // must not emit a second copy (that would issue a duplicate first query).
    expect(screen.getByRole('combobox').textContent).toContain('Last 30 Days');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies a shared preset range as day-aligned bounds', async () => {
    const onChange = vi.fn();
    renderBar(onChange);

    fireEvent.click(screen.getByRole('combobox'));
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
    renderBar(onChange);

    fireEvent.click(screen.getByRole('combobox'));
    // The trigger also reads "Last 30 Days"; the menu item is the later node
    // (the menu is portalled to the end of the document).
    const options = await screen.findAllByText('Last 30 Days');
    fireEvent.click(options[options.length - 1]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: null, dateTo: null }),
    );
    expect(screen.getByRole('combobox').textContent).toContain('All Time');
  });

  it('opens the shared date picker for a custom range', async () => {
    renderBar();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
  });

  it('re-opens the calendar instead of clearing a committed custom range', async () => {
    const onChange = vi.fn();
    renderBar(onChange);

    fireEvent.click(screen.getByRole('combobox'));
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
    fireEvent.click(screen.getByRole('combobox'));
    const options = await screen.findAllByText('Custom');
    fireEvent.click(options[options.length - 1]);

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('emits the committed custom range as day-aligned bounds', async () => {
    const onChange = vi.fn();
    renderBar(onChange);

    fireEvent.click(screen.getByRole('combobox'));
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
    expect(screen.getByRole('combobox').textContent).toContain('Custom');
  });
});
