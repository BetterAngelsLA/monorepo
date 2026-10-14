import { fireEvent, render, screen } from '@testing-library/react';
import { ExportDataModal } from './ExportDataModal';

// jsdom implements neither <dialog> nor ResizeObserver, both of which the real
// Modal reaches for. These tests render the actual modal rather than stubbing
// it out, so shim them here.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
});

function renderModal(disablePdfExport = false) {
  const onExport = vi.fn();
  const onClose = vi.fn();

  render(
    <ExportDataModal
      isOpen
      isExporting={false}
      disablePdfExport={disablePdfExport}
      rangeLabel="the last 30 days"
      onClose={onClose}
      onExport={onExport}
    />,
  );

  return { onExport, onClose };
}

function radio(name: RegExp) {
  return screen.getByRole('radio', { name }) as HTMLButtonElement;
}

function exportButton() {
  return screen.getByRole('button', { name: /^export$/i }) as HTMLButtonElement;
}

describe('ExportDataModal format picker', () => {
  it('defaults to CSV with every metric selected', () => {
    renderModal();

    expect(radio(/^csv$/i).getAttribute('aria-checked')).toBe('true');
    expect(exportButton().disabled).toBe(false);
  });

  it('moves the selection with arrow keys in the pressed direction', () => {
    renderModal();

    expect(radio(/^csv$/i).getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(radio(/^csv$/i), { key: 'ArrowRight' });
    expect(radio(/^xlsx$/i).getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(radio(/^xlsx$/i), { key: 'ArrowLeft' });
    expect(radio(/^csv$/i).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps arrow keys moving forward when PDF is unavailable', () => {
    // Regression: PDF is filtered out of the selectable list while blocked, so
    // a not-found index used to wrap the step round and move backwards.
    renderModal(true);

    const pdf = radio(/^pdf$/i);
    expect(pdf.disabled).toBe(true);

    fireEvent.keyDown(radio(/^csv$/i), { key: 'ArrowRight' });
    expect(radio(/^xlsx$/i).getAttribute('aria-checked')).toBe('true');
  });

  it('still walks the remaining formats backwards when PDF is unavailable', () => {
    renderModal(true);

    // Roving tabindex: focus and selection move together, so walk to the last
    // selectable format first.
    fireEvent.keyDown(radio(/^csv$/i), { key: 'ArrowRight' });
    fireEvent.keyDown(radio(/^xlsx$/i), { key: 'ArrowRight' });
    expect(radio(/^json$/i).getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(radio(/^json$/i), { key: 'ArrowLeft' });
    expect(radio(/^xlsx$/i).getAttribute('aria-checked')).toBe('true');
  });

  it('never lands the selection on an unavailable format', () => {
    renderModal(true);

    const csv = radio(/^csv$/i);
    // Walk a full lap; PDF must be skipped every time.
    for (let i = 0; i < 8; i++) {
      fireEvent.keyDown(screen.getByRole('radio', { name: /^[a-z]+$/i, checked: true }), {
        key: 'ArrowRight',
      });
      const checked = screen
        .getAllByRole('radio')
        .filter((el) => el.getAttribute('aria-checked') === 'true');
      expect(checked).toHaveLength(1);
      expect(checked[0].textContent).not.toBe('PDF');
    }
    expect(csv).toBeTruthy();
  });

  describe('PDF gating', () => {
    it('keeps CSV export available while PDF is unavailable', () => {
      renderModal(true);

      // The default (CSV) is unaffected by the blocked PDF.
      expect(exportButton().disabled).toBe(false);
    });

    it('disables the radio for the unavailable format so it cannot be selected', () => {
      renderModal(true);

      const pdf = radio(/^pdf$/i);
      expect(pdf.disabled).toBe(true);
      // Non-tabbable too, so keyboard users cannot strand themselves on it.
      expect(pdf.tabIndex).toBe(-1);

      fireEvent.click(pdf);
      expect(pdf.getAttribute('aria-checked')).toBe('false');
      expect(radio(/^csv$/i).getAttribute('aria-checked')).toBe('true');
    });
  });
});
