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
        // Build the payload to compress.
        const payload = {
          results,
          language: 'en', // or retrieve from your widget if desired
        };

        // Compress the payload using LZString.
        const encodedPayload = LZString.compressToEncodedURIComponent(
          JSON.stringify(payload)
        );

        // Build the request body for your Lambda endpoint.
        const requestBody = {
          data: encodedPayload,
          basePath: fullBasePath,
        };

        console.log('Request body:', requestBody);

        // Call your Lambda endpoint.
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
        console.log('Response data:', responseData);
        // Expect responseData to include a property "fileUrl".
        if (responseData.fileUrl) {
          // Trigger a download by creating an invisible anchor element.
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
    [lambdaEndpoint, results, fileName]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Download Your Action Plan"
        className={className}
        onClick={handleClick}
      >
        {isLoading ? (
          // Wrap the spinner in a container with whitespace-nowrap to prevent line breaks.
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
