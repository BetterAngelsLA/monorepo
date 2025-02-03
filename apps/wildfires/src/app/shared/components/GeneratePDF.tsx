import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './button/Button';

interface GeneratePDFProps {
  className?: string;
  printRef: React.RefObject<HTMLDivElement>;
}

function buildFullUrl(origin: string, ...pathSegments: string[]): string {
  const normalized = pathSegments
    .map((segment) => (segment || '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment !== '')
    .join('/');
  return new URL(normalized, origin).href;
}

const lambdaTranslateEndpoint = buildFullUrl(
  window.location.origin,
  'api',
  'generatePdf'
);

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

async function extractFullHTMLFromPrintContainer(
  printContainer: HTMLElement,
  baseUrl: string
): Promise<string> {
  const headClone = document.head.cloneNode(true) as HTMLElement;
  headClone.querySelectorAll('base, script').forEach((tag) => tag.remove());
  await inlineExternalCSS(headClone);

  // Add font face rules
  const fontFaceCSS = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => rule instanceof CSSFontFaceRule)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        return ''; // Skip cross-origin sheets
      }
    })
    .join('\n');

  const fontStyle = document.createElement('style');
  fontStyle.textContent = fontFaceCSS;
  headClone.appendChild(fontStyle);

  // Critical debug styles
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

  // Font loading safeguard
  const fontLoader = document.createElement('script');
  fontLoader.textContent = `document.fonts.ready.then(() => { window.fontsLoaded = true; });`;
  headClone.appendChild(fontLoader);

  const baseTag = document.createElement('base');
  baseTag.href = new URL(window.location.href).origin;
  headClone.insertBefore(baseTag, headClone.firstChild);

  const containerHtml = printContainer.outerHTML;

  return `<!DOCTYPE html>
<html lang="${document.documentElement.lang || 'en'}">
  <head>${headClone.innerHTML}</head>
  <body>${containerHtml}</body>
</html>`;
}

function getCurrentGoogleTranslateLanguage(): string | null {
  const combo = document.querySelector(
    '.goog-te-combo'
  ) as HTMLSelectElement | null;
  return combo ? combo.value : null;
}

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
  const [spinnerText, setSpinnerText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      setSpinnerText('.');
      interval = setInterval(() => {
        setSpinnerText((prev) => (prev === '...' ? '.' : prev + '.'));
      }, 500);
    }
    return () => interval && clearInterval(interval);
  }, [isGenerating]);

  const handleSaveHTML = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!printRef.current) return;

      try {
        setIsGenerating(true);
        const currentLang = getCurrentGoogleTranslateLanguage() || 'en';

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const fullHtml = await extractFullHTMLFromPrintContainer(
          printRef.current,
          window.location.href
        );

        const fileUrl = await callTranslateLambda(fullHtml, currentLang);
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.download = 'document.pdf';
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
      } catch (error) {
        console.error('Error generating PDF:', error);
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
                width: '3ch', // reserve width for 3 characters (max spinner dots)
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
