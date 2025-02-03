import { Link } from 'react-router-dom';
import {
  aboutPagePath,
  contactPagePath,
  privacyPolicyPagePath,
} from '../../../routes/routePaths';
import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';

type IProps = {
  className?: string;
};

export function NavLinks(props: IProps) {
  const { className } = props;

  const parentCss = ['flex-col', 'lg:flex-col', 'text-white', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="" />

      <Link
        aria-label="navigate to About page"
        to={aboutPagePath}
        className="mb-8"
      >
        <div className="lg:hidden">About</div>
        <div className="hidden lg:block">About</div>
      </Link>
      <Link
        aria-label="navigate to privacy policy"
        to={privacyPolicyPagePath}
        className="mb-8 hidden lg:block"
      >
        Privacy Policy
      </Link>
      <Link
        aria-label="navigate to Contact Us page"
        to={contactPagePath}
        className="mb-8 hidden lg:block"
      >
        Contact Us
      </Link>
    </div>
  );
}
