import { Link } from 'react-router-dom';
import {
  contactPagePath,
  privacyPolicyPagePath,
} from '../../../routes/routePaths';
import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';

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
      <Link
        aria-label="navigate to privacy policy"
        to={privacyPolicyPagePath}
        className="mb-8"
      >
        Privacy Policy
      </Link>
      <Link
        aria-label="navigate to Contact Us page"
        to={contactPagePath}
        className="mb-8"
      >
        Contact Us
      </Link>
    </div>
  );
}
