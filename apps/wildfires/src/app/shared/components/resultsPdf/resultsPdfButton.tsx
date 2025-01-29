import { mergeCss } from '../../utils/styles/mergeCss';
import { Button } from '../button/Button';

const API_2_PDF_API_KEY = '378d23ad-d251-4c49-84a9-4dcbf95574d2';

type IProps = {
  className?: string;
  tags?: string;
};

export default function ResultsPdfButton(props: IProps) {
  const { tags, className } = props;

  function onClick() {
    console.log('################################### on click');

    const appRrootUrl = window.location.origin;

    const pdfSourcePageUrl = `${appRrootUrl}/result-pdf?tags=${tags}`;

    console.log();
    console.log('| -------------  pdfSourcePageUrl  ------------- |');
    console.log(pdfSourcePageUrl);
    console.log();

    const pdfJobUrl = `https://v2.api2pdf.com/chrome/pdf/url?url={${pdfSourcePageUrl}}&apikey={${API_2_PDF_API_KEY}}`;

    console.log();
    console.log('| -------------  pdfJobUrl  ------------- |');
    console.log(pdfJobUrl);
    console.log();
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
