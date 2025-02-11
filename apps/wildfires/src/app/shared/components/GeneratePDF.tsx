import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './button/Button';

interface GeneratePDFProps {
  className?: string;
  printRef: React.RefObject<HTMLDivElement>;
}

// Define a type for the Lambda response
interface LambdaResponse {
  fileUrl: string;
}

/** Utility function to build a full URL from segments */
function buildFullUrl(origin: string, ...pathSegments: string[]): string {
  const normalized = pathSegments
    .map((segment) => (segment || '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment !== '')
    .join('/');
  return new URL(normalized, origin).href;
}

/** Lambda endpoint to generate the PDF */
const lambdaTranslateEndpoint = buildFullUrl(
  window.location.origin,
  'api',
  'generatePdf'
);

/**
 * Inlines external CSS by replacing link tags with style tags.
 * If a stylesheet fails to load, it is removed.
 */
async function inlineExternalCSS(headElement: HTMLElement): Promise<void> {
  const promises = Array.from(
    headElement.querySelectorAll('link[rel="stylesheet"]')
  ).map(async (link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    try {
      const cssResponse = await fetch(href);
      const cssText = await cssResponse.text();
      const style = document.createElement('style');
      style.textContent = cssText;
      link.replaceWith(style);
    } catch (error) {
      console.error('CSS inlining failed:', error);
      link.remove();
    }
  });
  await Promise.all(promises);
}

/**
 * Extracts the full HTML from the print container along with updated head content.
 * Waits for fonts to load (with a timeout fallback) before returning the HTML.
 */
async function extractFullHTMLFromPrintContainer(
  printContainer: HTMLElement,
  baseUrl: string
): Promise<string> {
  // Clone the head and remove unnecessary elements.
  const headClone = document.head.cloneNode(true) as HTMLElement;
  headClone.querySelectorAll('base, script').forEach((tag) => tag.remove());

  await inlineExternalCSS(headClone);

  // Append font-face CSS rules from accessible style sheets.
  const fontFaceCSS = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => rule instanceof CSSFontFaceRule)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        return ''; // Skip sheets that throw due to cross-origin restrictions.
      }
    })
    .join('\n');
  const fontStyle = document.createElement('style');
  fontStyle.textContent = fontFaceCSS;
  headClone.appendChild(fontStyle);

  // Append critical debug styles.
  const debugStyleTag = document.createElement('style');
  debugStyleTag.textContent = `
    * {
      color: #000 !important;
      opacity: 1 !important;
      visibility: visible !important;
      font-family: Arial, sans-serif !important;
    }
    .goog-te-banner, .goog-te-combo, .skiptranslate {
      display: none !important;
    }
    [style*="display:none"], [style*="visibility:hidden"] {
      display: block !important;
      visibility: visible !important;
    }
  `;
  headClone.appendChild(debugStyleTag);

  // Use the provided base URL for resolving relative URLs.
  const baseTag = document.createElement('base');
  baseTag.href = baseUrl;
  headClone.insertBefore(baseTag, headClone.firstChild);

  // Wait for fonts to load, but do not wait indefinitely.
  await Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);

  const containerHtml = printContainer.outerHTML;
  return `<!DOCTYPE html>
<html lang="${document.documentElement.lang || 'en'}">
  <head>${headClone.innerHTML}</head>
  <body>${containerHtml}</body>
</html>`;
}

/** Retrieves the current language from the Google Translate widget */
function getCurrentGoogleTranslateLanguage(): string | null {
  const combo = document.querySelector(
    '.goog-te-combo'
  ) as HTMLSelectElement | null;
  return combo ? combo.value : null;
}

/**
 * Calls the Lambda endpoint to translate HTML and generate a PDF.
 * Throws an error if the request fails or no file URL is returned.
 */
async function callTranslateLambda(
  html: string,
  targetLanguage: string
): Promise<string> {
  const response = await fetch(lambdaTranslateEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, targetLanguage }),
  });
  if (!response.ok) {
    throw new Error(`Lambda request failed with status ${response.status}`);
  }
  const data = (await response.json()) as LambdaResponse;
  if (!data.fileUrl) {
    throw new Error('No file URL returned from Lambda.');
  }
  return data.fileUrl;
}

/**
 * Custom hook for managing spinner text while generating a PDF.
 * Cycles through dots to simulate a loading spinner.
 */
function useSpinnerText(isActive: boolean, intervalMs = 500): string {
  const [spinnerText, setSpinnerText] = useState<string>('');
  useEffect(() => {
    if (!isActive) {
      setSpinnerText('');
      return;
    }
    setSpinnerText('.');
    const interval = setInterval(() => {
      setSpinnerText((prev) => (prev === '...' ? '.' : prev + '.'));
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isActive, intervalMs]);
  return spinnerText;
}

export const GeneratePDF = ({ className, printRef }: GeneratePDFProps) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const spinnerText = useSpinnerText(isGenerating);

  const handleSaveHTML = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!printRef.current) return;

      try {
        setIsGenerating(true);

        // Get the current language (defaulting to English).
        const currentLang = getCurrentGoogleTranslateLanguage() || 'en';

        // Extract the full HTML (waiting for fonts to load or timeout).
        const fullHtml = await extractFullHTMLFromPrintContainer(
          printRef.current,
          window.location.origin
        );

        // Generate the PDF via Lambda and retrieve its URL.
        const fileUrl = await callTranslateLambda(fullHtml, currentLang);

        // Create a temporary link to trigger the file download.
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.download = 'document.pdf';
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was a problem generating your PDF. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    [printRef]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Download Your Action Plan"
        className={className}
        onClick={handleSaveHTML}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            Generating PDF
            <span
              style={{
                display: 'inline-block',
                width: '3ch', // Reserve space for the spinner dots
                textAlign: 'left',
              }}
            >
              {spinnerText}
            </span>
          </>
        ) : (
          'Download Your Action Plan'
        )}
      </Button>
    </div>
  );
};

export default GeneratePDF;
