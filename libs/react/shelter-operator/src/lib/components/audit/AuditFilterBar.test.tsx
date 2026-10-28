import { fireEvent, render, screen } from '@testing-library/react';
import { AuditFilterBar } from './AuditFilterBar';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

function renderBar(onChange: (filters: unknown) => void = () => undefined) {
  return render(<AuditFilterBar onChange={onChange} />);
}

describe('AuditFilterBar', () => {
  it('applies a shared preset range', async () => {
    const onChange = vi.fn();
    renderBar(onChange);

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Last 7 Days'));

    expect(onChange).toHaveBeenCalledWith({
      dateFrom: expect.any(String),
      dateTo: expect.any(String),
    });
  });

  it('opens the shared date picker for a custom range', async () => {
    renderBar();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Custom'));

    expect(
      await screen.findByRole('dialog', { name: 'Select date range' }),
    ).not.toBeNull();
  });
});
