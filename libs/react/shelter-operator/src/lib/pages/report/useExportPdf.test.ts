import { act, renderHook, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { useExportPdf, type IExportPdfResult } from './useExportPdf';

// jsPDF and html2canvas-pro both need a real browser to do anything useful, so
// the seams are mocked and the assertions are about the geometry/ordering the
// hook asks for rather than the bytes that come back.
const mocks = vi.hoisted(() => ({
  addPage: vi.fn(),
  addImage: vi.fn(),
  output: vi.fn(),
  html2canvas: vi.fn(),
}));

const STUB_BLOB = new Blob(['stub'], { type: 'application/pdf' });

// `new jsPDF()` needs a constructible mock, so this has to be a `function`.
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return {
      internal: {
        pageSize: { getWidth: () => 612, getHeight: () => 792 },
      },
      addPage: mocks.addPage,
      addImage: mocks.addImage,
      output: mocks.output,
    };
  }),
}));

vi.mock('html2canvas-pro', () => ({ default: mocks.html2canvas }));

const IMG_DATA = 'data:image/png;base64,stub';

function stubCanvas() {
  return { toDataURL: () => IMG_DATA };
}

/** Builds a root node with `count` `[data-report-page="true"]` children under it. */
function reportRoot(count: number) {
  const root = document.createElement('div');
  for (let i = 0; i < count; i++) {
    const page = document.createElement('div');
    page.setAttribute('data-report-page', 'true');
    root.appendChild(page);
  }
  return root;
}

function renderExport(root: HTMLElement | null) {
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current = root;

  return { ...renderHook(() => useExportPdf(ref)), ref };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.html2canvas.mockResolvedValue(stubCanvas());
  mocks.output.mockReturnValue(STUB_BLOB);
});

describe('useExportPdf', () => {
  it('throws when the target ref is empty', async () => {
    const { result } = renderExport(null);

    await act(async () => {
      await expect(result.current.exportPdf('report.pdf')).rejects.toThrow(
        'Nothing to export',
      );
    });

    expect(mocks.html2canvas).not.toHaveBeenCalled();
    expect(result.current.isExporting).toBe(false);
  });

  it('throws when the target has no report-page nodes', async () => {
    const { result } = renderExport(reportRoot(0));

    await act(async () => {
      await expect(result.current.exportPdf('report.pdf')).rejects.toThrow(
        'Nothing to export',
      );
    });

    expect(mocks.html2canvas).not.toHaveBeenCalled();
  });

  it('resolves with the blob and filename it was given', async () => {
    const { result } = renderExport(reportRoot(1));

    let resolved: IExportPdfResult | null = null;
    await act(async () => {
      resolved = await result.current.exportPdf('shelter-5-report.pdf');
    });

    expect(resolved).toEqual({
      blob: STUB_BLOB,
      filename: 'shelter-5-report.pdf',
    });
  });

  it('captures each page node at scale 2 on a white background', async () => {
    const root = reportRoot(2);
    const { result } = renderExport(root);

    await act(async () => {
      await result.current.exportPdf('report.pdf');
    });

    const pageNodes = root.querySelectorAll('[data-report-page="true"]');
    expect(mocks.html2canvas).toHaveBeenCalledTimes(2);
    expect(mocks.html2canvas).toHaveBeenNthCalledWith(1, pageNodes[0], {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    expect(mocks.html2canvas).toHaveBeenNthCalledWith(2, pageNodes[1], {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
  });

  it('reports isExporting while the capture is in flight', async () => {
    let release: (canvas: unknown) => void = () => undefined;
    mocks.html2canvas.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    const { result } = renderExport(reportRoot(1));
    expect(result.current.isExporting).toBe(false);

    let pending: Promise<unknown>;
    act(() => {
      pending = result.current.exportPdf('report.pdf');
    });

    await waitFor(() => expect(result.current.isExporting).toBe(true));

    await act(async () => {
      release(stubCanvas());
      await pending;
    });

    expect(result.current.isExporting).toBe(false);
  });

  it('clears isExporting when the capture throws', async () => {
    mocks.html2canvas.mockRejectedValue(new Error('canvas exploded'));

    const { result } = renderExport(reportRoot(1));

    await act(async () => {
      await expect(result.current.exportPdf('report.pdf')).rejects.toThrow(
        'canvas exploded',
      );
    });

    expect(result.current.isExporting).toBe(false);
    expect(mocks.output).not.toHaveBeenCalled();
  });

  describe('render settling', () => {
    it('waits for the browser to paint before capturing', async () => {
      const frames: FrameRequestCallback[] = [];
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        frames.push(cb);
        return frames.length;
      });

      const { result } = renderExport(reportRoot(1));

      let pending: Promise<unknown>;
      act(() => {
        pending = result.current.exportPdf('report.pdf');
      });

      // Two frames must elapse before the first synchronous snapshot, or the
      // charts' canvas (created in a passive effect) would not exist yet.
      await waitFor(() => expect(frames.length).toBeGreaterThan(0));
      expect(mocks.html2canvas).not.toHaveBeenCalled();

      await act(async () => {
        while (frames.length) {
          const next = frames.shift();
          next?.(0);
          await Promise.resolve();
        }
        await pending;
      });

      expect(mocks.html2canvas).toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('returns null without capturing when the signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      const { result } = renderExport(reportRoot(1));

      let resolved: unknown;
      await act(async () => {
        resolved = await result.current.exportPdf('report.pdf', {
          signal: controller.signal,
        });
      });

      expect(resolved).toBeNull();
      expect(mocks.html2canvas).not.toHaveBeenCalled();
    });

    it('returns null instead of throwing when aborted mid-export', async () => {
      const controller = new AbortController();
      // Abort while the first capture is in flight.
      mocks.html2canvas.mockImplementation(async () => {
        controller.abort();
        return stubCanvas();
      });

      const { result } = renderExport(reportRoot(3));

      let resolved: unknown = 'unset';
      await act(async () => {
        resolved = await result.current.exportPdf('report.pdf', {
          signal: controller.signal,
        });
      });

      expect(resolved).toBeNull();
      // Stopped at the first page rather than rasterizing the rest.
      expect(mocks.html2canvas).toHaveBeenCalledTimes(1);
      expect(mocks.output).not.toHaveBeenCalled();
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('pagination', () => {
    it('draws a single page 1:1 onto the full PDF page for one report-page node', async () => {
      const { result } = renderExport(reportRoot(1));

      await act(async () => {
        await result.current.exportPdf('report.pdf');
      });

      expect(mocks.addPage).not.toHaveBeenCalled();
      expect(mocks.addImage).toHaveBeenCalledTimes(1);
      expect(mocks.addImage).toHaveBeenCalledWith(
        IMG_DATA,
        'PNG',
        0,
        0,
        612,
        792,
      );
    });

    it('adds one PDF page per report-page node, one fewer addPage than nodes', async () => {
      const { result } = renderExport(reportRoot(3));

      await act(async () => {
        await result.current.exportPdf('report.pdf');
      });

      expect(mocks.addImage).toHaveBeenCalledTimes(3);
      expect(mocks.addPage).toHaveBeenCalledTimes(2);

      for (let i = 0; i < 3; i++) {
        expect(mocks.addImage).toHaveBeenNthCalledWith(
          i + 1,
          IMG_DATA,
          'PNG',
          0,
          0,
          612,
          792,
        );
      }
    });
  });
});
