import LZString from 'lz-string';
import React, { useCallback } from 'react';
import { Button } from './button/Button';
import { TSurveyResults } from './survey/types';

function buildFullUrl(origin: string, ...pathSegments: string[]) {
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
  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!results) {
        console.error('No survey results provided.');
        return;
      }
      try {
        const payload = {
          results,
          language: 'en',
        };

        const encodedPayload = LZString.compressToEncodedURIComponent(
          JSON.stringify(payload)
        );

        const requestBody = {
          data: encodedPayload,
          basePath: fullBasePath,
        };

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
      }
    },
    [results, fileName] // Only dependencies needed here
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Download Your Wildfire Recovery Action Plan PDF"
        className={className}
        onClick={handleClick}
      >
        Download Your Wildfire Recovery Action Plan PDF
      </Button>
    </div>
  );
};
