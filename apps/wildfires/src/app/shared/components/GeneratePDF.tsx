import LZString from 'lz-string';
import React, { useCallback } from 'react';
import { Button } from './button/Button';
import { TSurveyResults } from './survey/types';

interface GeneratePDFProps {
  // The survey results payload as TSurveyResults (non-null)
  results: TSurveyResults | null;
  fileName?: string;
  className?: string;
}

const GeneratePDF = ({ results, className }: GeneratePDFProps) => {
  // Build the Lambda endpoint dynamically using the current window location.
  // For example, if your API route is /api/generatePdf, then:
  const lambdaEndpoint = `${window.location.origin}/api/generatePdf`;

  // Helper function to retrieve the current language from the Google Translate widget.
  // This assumes that the widget renders a <select> with the class "goog-te-combo".
  const getCurrentLanguage = (): string => {
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    return combo && combo.value ? combo.value : 'en';
  };

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!results) {
        console.error('No survey results provided.');
        return;
      }
      try {
        // Build the payload to compress.
        const payload = {
          results,
          language: getCurrentLanguage(),
        };

        // Compress the surveyResults payload using LZString.
        const encodedPayload = LZString.compressToEncodedURIComponent(
          JSON.stringify(payload)
        );

        // Build the request body for your Lambda endpoint.
        const requestBody = {
          data: encodedPayload,
          basePath:
            window.location.origin +
            import.meta.env.VITE_APP_BASE_PATH +
            '/printResult',
        };

        // Call your Lambda endpoint.
        const response = await fetch(lambdaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody), // <-- ensure we stringify the payload here!
        });

        if (!response.ok) {
          throw new Error(`Failed to generate PDF. Status: ${response.status}`);
        }

        const responseData = await response.json();
        // Expect responseData to include a property "fileUrl".
        if (responseData.fileUrl) {
          // Open the generated PDF in a new tab.
          window.open(responseData.fileUrl, '_blank');
        } else {
          throw new Error(
            'No file URL returned from the PDF generation endpoint.'
          );
        }
      } catch (error) {
        console.error('PDF generation failed:', error);
      }
    },
    [lambdaEndpoint, results]
  );

  return (
    <div className="flex flex-col items-center mx-auto">
      <Button
        ariaLabel="Generate PDF"
        className={className}
        onClick={handleClick}
      >
        Download Your Action Plan PDF
      </Button>
    </div>
  );
};

export default GeneratePDF;
