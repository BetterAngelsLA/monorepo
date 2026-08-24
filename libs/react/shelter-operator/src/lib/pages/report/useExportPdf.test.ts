import { act, renderHook, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { useExportPdf } from './useExportPdf';

// jsPDF and html2canvas-pro both need a real browser to do anything useful, so
// the seams are mocked and the assertions are about the geometry the hook asks
// for rather than the bytes that come back.
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  addPage: vi.fn(),
  addImage: vi.fn(),
  html2canvas: vi.fn(),
}));

// `new jsPDF()` needs a constructible mock, so this has to be a `function`.
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function () {
    return {
      internal: {
        pageSize: { getWidth: () => 612, getHeight: () => 792 },
      },
      addPage: mocks.addPage,
      addImage: mocks.addImage,
      save: mocks.save,
    };
  }),
}));

vi.mock('html2canvas-pro', () => ({ default: mocks.html2canvas }));

// US Letter at 72dpi, less the hook's 24pt margin on each side.
const MARGIN = 24;
const USABLE_WIDTH = 612 - MARGIN * 2; // 564
const USABLE_HEIGHT = 792 - MARGIN * 2; // 744

const IMG_DATA = 'data:image/png;base64,stub';

/** A canvas of `height`px captured from an 800px-wide report at scale 2. */
function canvasOfHeight(height: number) {
  return {
    width: 1600,
    height,
    toDataURL: () => IMG_DATA,
  };
}

function renderExport(filename = 'report.pdf') {
  const ref = createRef<HTMLElement>();
  // renderHook mounts into jsdom, so a detached div is enough of a target.
  (ref as { current: HTMLElement | null }).current =
    document.createElement('div');

  const view = renderHook(() => useExportPdf(ref, filename));

  return { ...view, ref };
}

beforeEach(() => {
  vi.clearAllMocks();
  // The real report is 800x921 CSS px, captured at scale 2.
  mocks.html2canvas.mockResolvedValue(canvasOfHeight(1842));
});

describe('useExportPdf', () => {
  it('does nothing when the target ref is empty', async () => {
    const ref = createRef<HTMLElement>();
    const { result } = renderHook(() => useExportPdf(ref, 'report.pdf'));

    await act(async () => {
      await result.current.exportPdf();
    });

    expect(mocks.html2canvas).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(result.current.isExporting).toBe(false);
  });

  it('saves under the filename it was given', async () => {
    const { result } = renderExport('shelter-report-5.pdf');

    await act(async () => {
      await result.current.exportPdf();
    });

    expect(mocks.save).toHaveBeenCalledWith('shelter-report-5.pdf');
  });

  it('captures at scale 2 on a white background', async () => {
    const { result, ref } = renderExport();

    await act(async () => {
      await result.current.exportPdf();
    });

    expect(mocks.html2canvas).toHaveBeenCalledWith(ref.current, {
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
      })
    );

    const { result } = renderExport();
    expect(result.current.isExporting).toBe(false);

    let pending: Promise<void>;
    act(() => {
      pending = result.current.exportPdf();
    });

    await waitFor(() => expect(result.current.isExporting).toBe(true));

    await act(async () => {
      release(canvasOfHeight(1842));
      await pending;
    });

    expect(result.current.isExporting).toBe(false);
  });

  it('clears isExporting when the capture throws', async () => {
    mocks.html2canvas.mockRejectedValue(new Error('canvas exploded'));

    const { result } = renderExport();

    await act(async () => {
      await expect(result.current.exportPdf()).rejects.toThrow(
        'canvas exploded'
      );
    });

    expect(result.current.isExporting).toBe(false);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  describe('pagination', () => {
    it('emits a single page for a report that fits', async () => {
      // 1842px at 1600px wide scales to 649pt tall — inside the 744pt page.
      const { result } = renderExport();

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mocks.addPage).not.toHaveBeenCalled();
      expect(mocks.addImage).toHaveBeenCalledTimes(1);
      expect(mocks.addImage).toHaveBeenCalledWith(
        IMG_DATA,
        'PNG',
        MARGIN,
        MARGIN,
        USABLE_WIDTH,
        (1842 * USABLE_WIDTH) / 1600
      );
    });

    it('adds a page per overflowing slice and shifts the image up each time', async () => {
      // 8000px scales to 2820pt tall — four 744pt pages.
      mocks.html2canvas.mockResolvedValue(canvasOfHeight(8000));
      const imgHeight = (8000 * USABLE_WIDTH) / 1600;

      const { result } = renderExport();

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mocks.addImage).toHaveBeenCalledTimes(4);
      // One fewer addPage than pages: the first page already exists.
      expect(mocks.addPage).toHaveBeenCalledTimes(3);

      for (let page = 0; page < 4; page++) {
        expect(mocks.addImage).toHaveBeenNthCalledWith(
          page + 1,
          IMG_DATA,
          'PNG',
          MARGIN,
          MARGIN - page * USABLE_HEIGHT,
          USABLE_WIDTH,
          imgHeight
        );
      }
    });

    it('still emits one page when the capture comes back empty', async () => {
      mocks.html2canvas.mockResolvedValue(canvasOfHeight(0));

      const { result } = renderExport();

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mocks.addImage).toHaveBeenCalledTimes(1);
      expect(mocks.addPage).not.toHaveBeenCalled();
      expect(mocks.save).toHaveBeenCalled();
    });

    it('does not add a trailing blank page when the report lands exactly on the page boundary', async () => {
      // Exactly 744pt tall: 744 * 1600 / 564 = 2110.6... px, so pick the
      // canvas height that divides evenly.
      const exact = (USABLE_HEIGHT * 1600) / USABLE_WIDTH;
      mocks.html2canvas.mockResolvedValue(canvasOfHeight(exact));

      const { result } = renderExport();

      await act(async () => {
        await result.current.exportPdf();
      });

      expect(mocks.addImage).toHaveBeenCalledTimes(1);
      expect(mocks.addPage).not.toHaveBeenCalled();
    });
  });
});
