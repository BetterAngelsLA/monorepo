import { useRef } from 'react';
import GeneratePDF from '../../shared/components/GeneratePDF';
import { FiresSurvey } from './firesSurvey/FiresSurvey';

export function HomePage() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  // TODO: move this to the actual result page when we get these
  const generateFileName = () => {
    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `Wildfire Action Plan - ${timestamp}.pdf`;
  };

  return (
    <div ref={pageRef}>
      <FiresSurvey />

      <GeneratePDF pageRef={pageRef} fileName={generateFileName} />
    </div>
  );
}
