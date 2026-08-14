import { jsPDF } from 'jspdf';
import { RefObject, useCallback, useState } from 'react';

/**
 * Captures a DOM node to a canvas (via html2canvas-pro, which supports
 * Tailwind v4's oklch() colors) and saves it as a multi-page PDF.
 */
export function useExportPdf(
  targetRef: RefObject<HTMLElement | null>,
  filename: string
) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = useCallback(async () => {
    const node = targetRef.current;
    if (!node) return;

    setIsExporting(true);
    try {
      // Dynamic import keeps html2canvas-pro out of the initial bundle.
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 24;

      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      const usablePageHeight = pageHeight - margin * 2;

      // Draw the full image on each page, shifted up by a page's worth each
      // time so the next slice shows through the margins. A report that fits
      // on one page is just the single-iteration case.
      const pageCount = Math.max(1, Math.ceil(imgHeight / usablePageHeight));

      for (let page = 0; page < pageCount; page++) {
        if (page > 0) doc.addPage();
        doc.addImage(
          imgData,
          'PNG',
          margin,
          margin - page * usablePageHeight,
          usableWidth,
          imgHeight
        );
      }

      doc.save(filename);
    } finally {
      setIsExporting(false);
    }
  }, [targetRef, filename]);

  return { exportPdf, isExporting };
}
