import LZString from 'lz-string';
import React, { useCallback } from 'react';
import { Button } from './button/Button';
import { TSurveyResults } from './survey/types';

interface GeneratePDFProps {
  // The survey results payload (non-null)
  results: TSurveyResults | null;
  fileName?: string;
  className?: string;
}

const GeneratePDF = ({
  results,
  fileName = 'your-wildfire-recovery-action-plan.pdf',
  className,
}: GeneratePDFProps) => {
  // Build the Lambda endpoint dynamically using the current window location.
  // For example, if your API route is /api/generatePdf, then:
  const lambdaEndpoint = `${window.location.origin}/api/generatePdf`;

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!results) {
        console.error('No survey results provided.');
        return;
      }
      try {
        // Build the payload to compress.
        // (Optionally, you can include a language field if needed.)
        const payload = {
          results,
          language: 'en', // or retrieve from your widget if desired
        };

        // Compress the payload using LZString.
        const encodedPayload = LZString.compressToEncodedURIComponent(
          JSON.stringify(payload)
        );

        const basePath = new URL(
          import.meta.env.VITE_APP_BASE_PATH + '/printResult',
          window.location.origin
        ).href;

        // Build the request body for your Lambda endpoint.
        const requestBody = {
          data: encodedPayload,
          basePath: basePath,
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
        // Expect responseData to include a property "fileUrl".
        console.log(responseData);
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
      }
    },
    [lambdaEndpoint, results, fileName]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Download Your Recovery Action Plan PDF"
        className={className}
        onClick={handleClick}
      >
        Download Your Action Plan PDF
      </Button>
    </div>
  );
};

export default GeneratePDF;
