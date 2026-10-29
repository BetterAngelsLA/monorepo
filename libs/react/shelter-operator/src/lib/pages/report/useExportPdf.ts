import { RefObject, useCallback, useState } from 'react';

export interface IExportPdfResult {
  blob: Blob;
  filename: string;
}

export interface IExportPdfOptions {
  /**
   * Aborts an in-flight export. The off-screen report is unmounted when the
   * export modal closes, so a capture that is still queued would otherwise
   * rasterize a detached node and fail with an html2canvas-internal error.
   */
  signal?: AbortSignal;
}

/**
 * Resolves once the browser has painted twice.
 *
 * The report's charts are canvas charts (`@ant-design/plots`/G2) whose
 * `<canvas>` is only created inside the library's render, which runs from a
 * React *passive* effect. `flushSync` commits the report's props to the DOM but
 * does not flush passive effects, and `html2canvas-pro` snapshots the DOM
 * synchronously — so capturing without yielding first can rasterize a report
 * whose plot areas have no canvas at all. Two frames gives the effect chain
 * (commit → passive effects → library render → paint) room to finish.
 */
function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** `requestAnimationFrame` in a background tab can stall, so cap the wait. */
const MAX_PAINT_WAIT_MS = 250;

/**
 * A pending webfont request can keep `document.fonts.ready` unresolved
 * indefinitely; the export must not hang (and hold `isExporting`) forever
 * waiting for a font the report may not even use.
 */
const MAX_FONT_WAIT_MS = 2000;

/**
 * Resolves when `promise` settles or `ms` elapses, whichever comes first, and
 * discards the value: callers only care that the wait is over.
 */
function withTimeout(
  promise: Promise<unknown> | undefined,
  ms: number,
): Promise<void> {
  const settled = Promise.resolve(promise).then(() => undefined);
  const expired = new Promise<void>((resolve) => setTimeout(resolve, ms));
  return Promise.race([settled, expired]);
}

function waitForPaint(): Promise<void> {
  return withTimeout(waitForNextPaint(), MAX_PAINT_WAIT_MS);
}

/**
 * Captures each `[data-report-page="true"]` node under `targetRef` (see
 * ShelterReportPrint.tsx — one node per physical Letter page) via
 * html2canvas-pro (which, unlike plain html2canvas/react-to-pdf, supports
 * Tailwind v4's oklch() colors) and assembles them 1:1 into a multi-page
 * Letter PDF, returned as a Blob. Capturing per-page nodes (each already a
 * fixed 816x1056px / 8.5x11in-at-96dpi box) means page breaks land exactly
 * where they do in the DOM, instead of an arbitrary pixel-height slice.
 */
export function useExportPdf(targetRef: RefObject<HTMLElement | null>) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = useCallback(
    async (
      filename: string,
      options: IExportPdfOptions = {},
    ): Promise<IExportPdfResult | null> => {
      const { signal } = options;
      if (signal?.aborted) return null;

      const root = targetRef.current;
      if (!root) {
        throw new Error('Nothing to export');
      }

      const pageNodes = Array.from(
        root.querySelectorAll<HTMLElement>('[data-report-page="true"]'),
      );
      if (pageNodes.length === 0) {
        throw new Error('Nothing to export');
      }

      setIsExporting(true);
      try {
        // Dynamic imports keep html2canvas-pro/jspdf out of the initial bundle.
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import('html2canvas-pro'),
          import('jspdf'),
        ]);
        if (signal?.aborted) return null;

        // Settle chart/font rendering before the first synchronous snapshot.
        // `document.fonts` is optional: the Font Loading API is not universal.
        await Promise.all([
          waitForPaint(),
          withTimeout(document.fonts?.ready, MAX_FONT_WAIT_MS),
        ]);
        if (signal?.aborted) return null;

        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < pageNodes.length; i++) {
          // Re-check each page: the modal can close mid-export, and that
          // aborts the run before we touch a node it may have unmounted.
          if (signal?.aborted) return null;

          const canvas = await html2canvas(pageNodes[i], {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
          });
          const imgData = canvas.toDataURL('image/png');

          if (i > 0) doc.addPage();
          // Each page node is already sized to the physical page's exact
          // aspect ratio, so it maps 1:1 onto the full PDF page.
          doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        const blob = doc.output('blob');
        return { blob, filename };
      } finally {
        setIsExporting(false);
      }
    },
    [targetRef],
  );

  return { exportPdf, isExporting };
}
