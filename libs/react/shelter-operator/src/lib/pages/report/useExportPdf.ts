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

      if (imgHeight <= usablePageHeight) {
        // Single page fits.
        doc.addImage(imgData, 'PNG', margin, margin, usableWidth, imgHeight);
      } else {
        // Taller than one page: render the full image on each page, shifting it
        // up by a page worth each time so a new slice shows through the margins.
        let heightLeft = imgHeight;
        let position = margin;
        doc.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= usablePageHeight;
        while (heightLeft > 0) {
          position -= usablePageHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
          heightLeft -= usablePageHeight;
        }
      }

      doc.save(filename);
    } finally {
      setIsExporting(false);
    }
  }, [targetRef, filename]);

  return { exportPdf, isExporting };
}
