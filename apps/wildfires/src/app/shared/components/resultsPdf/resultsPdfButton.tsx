import { mergeCss } from '../../utils/styles/mergeCss';
import { Button } from '../button/Button';

const API_2_PDF_API_KEY = '378d23ad-d251-4c49-84a9-4dcbf95574d2';

const API_2_PDF_URL = 'https://v2.api2pdf.com/chrome/pdf/url';

type IGeneratePDF = {
  pageUrl: string;
};

const generatePDF = async (props: IGeneratePDF) => {
  const { pageUrl } = props;

  const options = {
    url: pageUrl,
    inline: true,
    filename: 'my-action-plan.pdf',
    delay: 1000,
  };

  console.log(console.log('################################### pageUrl'));
  console.log(pageUrl);
  console.log('options');
  console.log(options);
  console.log();

  try {
    const response = await fetch(API_2_PDF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${API_2_PDF_API_KEY}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const data = await response.json();

    const pdfUrl = data?.FileUrl;

    console.log('Generated PDF URL:', pdfUrl);

    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

type IProps = {
  className?: string;
  tags?: string;
};

export default function ResultsPdfButton(props: IProps) {
  const { tags, className } = props;

  async function onClick() {
    console.log('################################### on click');

    const appRrootUrl = window.location.origin;

    const pdfRenderPageUrl = `${appRrootUrl}/result-pdf?tags=${tags}`;

    await generatePDF({
      pageUrl: pdfRenderPageUrl,
    });
  }

  const parentCss = [className];

  return (
    <Button
      className={mergeCss(parentCss)}
      ariaLabel="Save your action plan as a PDF file"
      onClick={onClick}
    >
      Save Your Action Plan as a PDF
    </Button>
  );
}
