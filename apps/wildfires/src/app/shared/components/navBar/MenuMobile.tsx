import { Link } from 'react-router-dom';
import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';

type IProps = {
  className?: string;
};

export function MenuMobile(props: IProps) {
  const { className } = props;

  const parentCss = [
    'flex',
    'flex-col',
    'items-end',
    'text-white',
    'pt-8',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="mb-8" />
      {/* <GoogleTranslateBtn className="mb-8" /> */}
      <Link to="/privacy-policy" className="mb-8">
        Privacy Policy
      </Link>
      <a href="mailto:wildfires@betterangels.la" className="mb-8">
        Contact Us
      </a>
      <DonateButton className="max-w-40 mb-4" />
    </div>
  );
}
