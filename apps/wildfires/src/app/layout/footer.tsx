import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import BA_LOGO from '../../assets/images/ba-logo-blue-white.png';
import { mergeCss } from '../shared/utils/styles/mergeCss';

type IParams = {
  className?: string;
};

export function Footer(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    'w-full',
    'flex',
    'md:flex-row',
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
      <div className="flex ml-2 mb-4">
        <a href="https://www.betterangels.la/">
          <img src={BA_LOGO} alt="Better Angels LA" className="h-9" />
        </a>
      </div>
      <div className="flex flex-col align-end gap-14 ml-14">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 md:text-2xl">
          <Link to="/about">About LA Disaster Relief Navigator</Link>
          <a href="mailto:wildfires@betterangels.la">Contact Us</a>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </div>
        <div className="md:text-2xl text-end md:text-auto">
          © 2025 Better Angels Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
