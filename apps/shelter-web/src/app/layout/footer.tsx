import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  aboutUsPath,
  privacyPolicyPath,
  shelterHomePath,
} from '../routes/routePaths';

type IParams = {
  className?: string;
};

export function Footer(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    className,
    'w-full',
    'flex',
    'flex-col',
    'min-h-52',
    'py-10',
    'text-white',
  ].join(' ');

  const hoverBtnCss = [
    'relative',
    'h-[39px]',
    'hover:bg-[#375C76]',
    'md:hover:bg-transparent',
    'transition',
    'flex',
    'items-center',
    'px-4',
    'md:w-auto',
    'md:h-auto',
    'md:px-0',
    '-mx-4',
    'pl-8',
    'pr-8',
    'md:mx-0',
    'md:pl-0',
    'md:pr-0',
  ];

  return (
    <footer className={parentCss}>
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center mb-11 md:mt-3">
          <BaShelterLogoIcon className="h-8" />
          <div className="text-white flex ml-3 text-2xl">
            <div className="font-normal">Shelter</div>
            <div className="font-semibold">LA</div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-[14px] md:mb-9">
          <Link
            aria-label="navigate to Homepage"
            to={shelterHomePath}
            className={mergeCss(hoverBtnCss)}
          >
            Home
          </Link>
          <Link
            aria-label="navigate to About page"
            to={aboutUsPath}
            className={mergeCss(hoverBtnCss)}
          >
            About Us
          </Link>
          <Link
            aria-label="navigate to Privacy Policy page"
            to={privacyPolicyPath}
            className={mergeCss(hoverBtnCss)}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="-mx-4 md:mx-0">
        <div className="mt-12 md:mt-6 border-t-[0.5px] border-[#375C76] pt-6 flex justify-start md:justify-end px-4 md:px-0">
          <div className="text-xs">
            © 2025 Better Angels Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
