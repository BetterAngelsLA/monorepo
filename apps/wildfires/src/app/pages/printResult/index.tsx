import LZString from 'lz-string';
import { useEffect, useState } from 'react';
import NavigatorLogo from '../../../assets/images/la_disaster_relief_navigator_logo_dark.png';
import { HorizontalLayout } from '../../layout/horizontalLayout';
import BestPractices from '../../shared/components/bestPractices/BestPractices';
import Hero from '../../shared/components/hero/Hero';
import { TSurveyResults } from '../../shared/components/survey/types';
import { SurveyResults } from '../../shared/components/surveyResults/SurveyResults';
import { usePrint } from '../../shared/providers/PrintProvider';

export default function PrintResult() {
  const [surveyResults, setSurveyResults] = useState<TSurveyResults | null>(
    null
  );
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compressedData = params.get('data');
    if (compressedData) {
      try {
        // Decompress the payload from the URL parameter.
        const decompressed =
          LZString.decompressFromEncodedURIComponent(compressedData);
        if (decompressed) {
          const { results, language: payloadLanguage } =
            JSON.parse(decompressed);
          setSurveyResults(results);
          setLanguage(payloadLanguage);
        }
      } catch (error) {
        console.error('Error decompressing survey data:', error);
      }
    }
  }, []);

  const { setPrinting } = usePrint();

  useEffect(() => {
    const setLanguageFromWidget = () => {
      const combo = document.querySelector(
        '.goog-te-combo'
      ) as HTMLSelectElement;
      if (combo) {
        // Only update the widget if the language is not 'en'
        if (language && language !== 'en') {
          combo.value = language;
          const event = new Event('change', { bubbles: true });
          combo.dispatchEvent(event);
        }
      } else {
        setTimeout(setLanguageFromWidget, 1000);
      }
    };

    setLanguageFromWidget();
  }, [language]);

  useEffect(() => {
    setPrinting(true);
  }, [setPrinting]);

  return (
    <>
      <div className="w-full" id="print-container">
        <HorizontalLayout className="bg-brand-dark-blue print:bg-white">
          <Hero className="hero-print min-h-[20vh] py-14 md:py-28 relative">
            <h1 className="font-light border-l-[10px] pl-4 md:pl-8 border-brand-yellow text-5xl text-white print:text-black md:text-[58px] md:leading-[1.2]">
              Your Wildfire
              <span className="md:hidden print:hidden">
                <br />
              </span>{' '}
              Recovery
              <span className="md:hidden print:hidden">
                <br />
              </span>{' '}
              Action Plan
            </h1>
            <div className="print-logo-container hidden print:block">
              <img
                src={NavigatorLogo}
                alt="LA Disaster Relief Navigator Logo"
                className="mx-auto w-32 print:w-auto print:max-h-12"
                style={{
                  maxWidth: '220px',
                  height: 'auto',
                }}
              />
            </div>
          </Hero>
        </HorizontalLayout>
        <HorizontalLayout>
          <BestPractices />
          {surveyResults && (
            <SurveyResults className="mt-8 mb-24" results={surveyResults} />
          )}
        </HorizontalLayout>
      </div>
    </>
  );
}
