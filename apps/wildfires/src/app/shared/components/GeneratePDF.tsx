import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePrint } from '../providers/PrintProvider';
import { Button } from './button/Button';

interface GeneratePDFProps {
  className?: string;
  // A ref to the container that renders the content to be exported.
  printRef: React.RefObject<HTMLDivElement>;
}

/**
 * Utility: builds a full URL from an origin and one or more path segments.
 */
function buildFullUrl(origin: string, ...pathSegments: string[]): string {
  const normalized = pathSegments
    .map((segment) => (segment || '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment !== '')
    .join('/');
  return new URL(normalized, origin).href;
}

// Configure your Lambda endpoint here:
const lambdaTranslateEndpoint = buildFullUrl(
  window.location.origin,
  'api',
  'generatePdf'
);

/**
 * Inlines external CSS files in the given head element.
 */
async function inlineExternalCSS(headElement: HTMLElement): Promise<void> {
  const linkElements = headElement.querySelectorAll('link[rel="stylesheet"]');
  const promises = Array.from(linkElements).map(async (link) => {
    const href = link.getAttribute('href');
    if (href) {
      try {
        const response = await fetch(href);
        if (response.ok) {
          const cssText = await response.text();
          const styleTag = document.createElement('style');
          styleTag.textContent = cssText;
          link.parentNode?.insertBefore(styleTag, link);
          link.remove();
        } else {
          console.warn(
            `Failed to fetch CSS from ${href} (status ${response.status}).`
          );
        }
      } catch (e) {
        console.error(`Error fetching CSS from ${href}:`, e);
      }
    }
  });
  await Promise.all(promises);
}

/**
 * Combines a clone of the document’s <head> (with inlined external CSS and a new <base> tag)
 * with the print container’s HTML to form a complete HTML document.
 */
async function extractFullHTMLFromPrintContainer(
  printContainer: HTMLElement,
  baseUrl: string
): Promise<string> {
  const headClone = document.head.cloneNode(true) as HTMLElement;
  headClone.querySelectorAll('base, script').forEach((tag) => tag.remove());
  await inlineExternalCSS(headClone);
  const baseTag = document.createElement('base');
  baseTag.href = baseUrl;
  headClone.insertBefore(baseTag, headClone.firstChild);

  const containerHtml = printContainer.outerHTML;
  return `<!DOCTYPE html>
<html lang="${document.documentElement.lang || 'en'}">
  <head>${headClone.innerHTML}</head>
  <body>${containerHtml}</body>
</html>`;
}

/**
 * Returns the current language selected in the Google Translate widget.
 */
function getCurrentGoogleTranslateLanguage(): string | null {
  const combo = document.querySelector(
    '.goog-te-combo'
  ) as HTMLSelectElement | null;
  return combo ? combo.value : null;
}

/**
 * Attempts to revert Google Translate to the original language ("en").
 */
function revertGoogleTranslateToOriginal(originalLang: string): Promise<void> {
  return new Promise((resolve) => {
    const bannerFrame = document.querySelector(
      'iframe.goog-te-banner-frame'
    ) as HTMLIFrameElement | null;
    if (bannerFrame) {
      try {
        const innerDoc =
          bannerFrame.contentDocument || bannerFrame.contentWindow?.document;
        if (innerDoc) {
          const showOriginalButton = innerDoc.querySelector(
            '.goog-te-banner-switch'
          );
          if (showOriginalButton) {
            (showOriginalButton as HTMLElement).click();
            console.log('Clicked "Show original" button.');
            setTimeout(resolve, 1000);
            return;
          }
        }
      } catch (error) {
        console.warn('Unable to access Google Translate banner frame:', error);
      }
    }
    const combo = document.querySelector(
      '.goog-te-combo'
    ) as HTMLSelectElement | null;
    if (combo) {
      combo.value = originalLang;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Fallback: set Google Translate to "${originalLang}".`);
      setTimeout(resolve, 1000);
    } else {
      console.warn('Google Translate widget not found.');
      resolve();
    }
  });
}

/**
 * Restores the previous Google Translate language.
 */
function restorePreviousTranslation(targetLang: string): Promise<void> {
  return new Promise((resolve) => {
    const combo = document.querySelector(
      '.goog-te-combo'
    ) as HTMLSelectElement | null;
    if (combo) {
      combo.value = 'en';
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Temporarily set Google Translate to English.');
      setTimeout(() => {
        combo.value = targetLang;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Restored Google Translate to "${targetLang}".`);
        setTimeout(resolve, 250);
      }, 250);
    } else {
      console.warn('Google Translate widget not found for restoration.');
      resolve();
    }
  });
}

/**
 * Helper to detect Safari (desktop or iOS)
 */
function isSafariBrowser() {
  const ua = navigator.userAgent;
  return (
    ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS')
  );
}

/**
 * Calls the Lambda endpoint, sending the extracted HTML along with the current language.
 */
const callTranslateLambda = async (html: string, currentLanguage: string) => {
  const response = await fetch(lambdaTranslateEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, targetLanguage: currentLanguage }),
  });
  if (!response.ok) {
    throw new Error(`Lambda request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.fileUrl;
};

export const GeneratePDF = ({ className, printRef }: GeneratePDFProps) => {
  const { isPrinting, setPrinting } = usePrint();
  const [spinnerText, setSpinnerText] = useState<string>('');
  const downloadButtonRef = useRef<HTMLDivElement>(null);

  // Cycle spinner text while printing.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPrinting) {
      setSpinnerText('.');
      interval = setInterval(() => {
        setSpinnerText((prev) => (prev === '...' ? '.' : prev + '.'));
      }, 500);
    } else {
      setSpinnerText('');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPrinting]);

  const handleSaveHTML = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!printRef.current) {
        console.error('Print container ref is not attached.');
        return;
      }
      const currentLang = getCurrentGoogleTranslateLanguage() || 'en';
      try {
        // Start printing mode (show full-screen toast and disable the button).
        setPrinting(true);
        console.log('Printing mode activated.');
        console.log('Current Google Translate language:', currentLang);

        // For Safari: scroll the download button into view.
        if (isSafariBrowser()) {
          setTimeout(() => {
            downloadButtonRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            });
          }, 150);
        }

        // Revert the page to English for export.
        await revertGoogleTranslateToOriginal('en');
        console.log('Reverted Google Translate to English.');

        // Wait briefly for page updates.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Extract the full HTML.
        const fullHtml = await extractFullHTMLFromPrintContainer(
          printRef.current,
          window.location.href
        );
        console.log('Extracted full HTML.');

        // Restore the previous translation.
        await restorePreviousTranslation(currentLang);

        // Call the Lambda endpoint.
        const fileUrl = await callTranslateLambda(fullHtml, currentLang);
        console.log('Received fileUrl from Lambda:', fileUrl);

        // Trigger the PDF download.
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.download = 'translated_print_container.pdf';
        document.body.appendChild(fileLink);
        fileLink.click();

        // Wait a fixed delay to simulate waiting until the link is "finished clicked."
        await new Promise((resolve) => setTimeout(resolve, 2000));

        document.body.removeChild(fileLink);
        console.log('Translated file downloaded.');
      } catch (error) {
        console.error('Error generating translated file:', error);
      } finally {
        // Turn off printing mode (hide the full-screen toast).
        setPrinting(false);
        console.log('Printing mode deactivated.');
      }
    },
    [printRef, setPrinting]
  );

  return (
    <>
      <div
        ref={downloadButtonRef}
        className="flex flex-col items-center mx-auto"
      >
        <Button
          ariaLabel="Download Your Action Plan"
          className={className}
          onClick={handleSaveHTML}
          disabled={isPrinting}
        >
          Download Your Action Plan
        </Button>
      </div>

      {/* Full-screen toast overlay */}
      {isPrinting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: '2rem',
              textAlign: 'center',
            }}
          >
            Generating PDF {spinnerText}
          </div>
        </div>
      )}
    </>
  );
};

export default GeneratePDF;
