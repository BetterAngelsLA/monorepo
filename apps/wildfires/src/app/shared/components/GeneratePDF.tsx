import LZString from 'lz-string';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './button/Button';
import { TSurveyResults } from './survey/types';

function buildFullUrl(origin: string, ...pathSegments: string[]): string {
  const normalizedSegments = pathSegments
    .map((segment) => (segment || '').replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment !== '');
  const fullPath = normalizedSegments.join('/');
  return new URL(fullPath, origin).href;
}

// Helper function to retrieve the current language from the Google Translate widget.
// This assumes that the widget renders a <select> with the class "goog-te-combo".
const getCurrentLanguage = (): string => {
  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  return combo && combo.value ? combo.value : 'en';
};

const fullBasePath = buildFullUrl(
  window.location.origin,
  import.meta.env.VITE_APP_BASE_PATH || '',
  'printResult'
);

const lambdaEndpoint = buildFullUrl(
  window.location.origin,
  'api',
  'generatePdf'
);

interface GeneratePDFProps {
  results: TSurveyResults | null;
  fileName?: string;
  className?: string;
}

export const GeneratePDF = ({
  results,
  fileName = 'your-wildfire-recovery-action-plan.pdf',
  className,
}: GeneratePDFProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [spinnerText, setSpinnerText] = useState<string>('');

  // Setup a text spinner that cycles through ".", "..", "..."
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setSpinnerText('.');
      interval = setInterval(() => {
        setSpinnerText((prev) => {
          if (prev === '...') {
            return '.';
          } else {
            return prev + '.';
          }
        });
      }, 500);
    } else {
      setSpinnerText('');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!results) {
        console.error('No survey results provided.');
        return;
      }
      try {
        setIsLoading(true);
        const payload = {
          results,
          language: getCurrentLanguage(),
        };

        const encodedPayload = LZString.compressToEncodedURIComponent(
          JSON.stringify(payload)
        );

        const requestBody = {
          data: encodedPayload,
          basePath: fullBasePath,
        };

        console.log(requestBody);

        const response = await fetch(lambdaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate PDF. Status: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData.fileUrl) {
          const link = document.createElement('a');
          link.href = responseData.fileUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error(
            'No file URL returned from the PDF generation endpoint.'
          );
        }
      } catch (error) {
        console.error('PDF generation failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [results, fileName]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Download Your Action Plan"
        className={className}
        onClick={handleClick}
      >
        {isLoading ? (
          <div className="flex items-center whitespace-nowrap">
            <span>Generating PDF</span>
            <span
              style={{
                display: 'inline-block',
                width: '2em',
                textAlign: 'left',
                marginLeft: '0.5rem',
              }}
            >
              {spinnerText}
            </span>
          </div>
        ) : (
          'Download Your Action Plan'
        )}
      </Button>
    </div>
  );
};

export default GeneratePDF;
