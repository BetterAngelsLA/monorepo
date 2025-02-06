import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import BA_LOGO from '../../assets/images/ba-logo-blue-white.png';
import {
  aboutPagePath,
  contactPagePath,
  privacyPolicyPagePath,
} from '../routes/routePaths';
import { mergeCss } from '../shared/utils/styles/mergeCss';

type IParams = {
  className?: string;
};

export function Footer(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    'w-full',
    'flex',
    'justify-between',
    'flex-col',
    'min-h-52',
    'mx-auto',
    'py-20',
    'text-white',
    className,
  ];

  return (
    <footer className={mergeCss(parentCss)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex ml-2 mb-8 md:mb-0">
          <a
            aria-label="open Better Angels website in new tab"
            target="_blank"
            href="https://www.betterangels.la/"
            rel="noreferrer"
          >
            <img src={BA_LOGO} alt="Better Angels LA" className="h-9" />
          </a>
        </div>
        <div className="flex flex-col align-end gap-14 ml-4">
          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <Link aria-label="navigate to About page" to={aboutPagePath}>
              About
            </Link>
            <Link aria-label="navigate to Contact Us page" to={contactPagePath}>
              Contact Us
            </Link>
            <Link
              aria-label="navigate to privacy policy"
              to={privacyPolicyPagePath}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-steel-blue w-full h-[1px] my-4" />
      <div className="text-end md:text-auto">
        © 2025 Better Angels Inc. All rights reserved.
      </div>
    </footer>
  );
}
