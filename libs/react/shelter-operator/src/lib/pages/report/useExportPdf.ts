import { RefObject, useCallback, useState } from 'react';

export interface IExportPdfResult {
  blob: Blob;
  filename: string;
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
    async (filename: string): Promise<IExportPdfResult> => {
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

        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < pageNodes.length; i++) {
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
