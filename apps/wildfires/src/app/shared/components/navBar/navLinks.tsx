import { Link } from 'react-router-dom';
import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';

type IProps = {
  className?: string;
};

export function NavLinks(props: IProps) {
  const { className } = props;

  const parentCss = ['flex-col', 'lg:flex-col', 'text-white', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="" />

      <Link to="/about" className="mb-8">
        <div className="lg:hidden">About</div>
        <div className="hidden lg:block">
          About LA Disaster Relief Navigator
        </div>
      </Link>

      {/* <TranslateBtn className="mb-8" /> */}

      <Link to="/privacy-policy" className="mb-8 hidden lg:block">
        Privacy Policy
      </Link>

      <a
        href="mailto:wildfires@betterangels.la"
        className="mb-8 hidden lg:block"
      >
        Contact Us
      </a>

      <DonateButton className="max-w-40 mb-4" />
    </div>
  );
}
