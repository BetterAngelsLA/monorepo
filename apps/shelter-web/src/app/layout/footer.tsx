import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { aboutUsPath, shelterHomePath } from '../routes/routePaths';

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
        <div className="flex flex-col md:flex-row gap-6 text-[14px] md:mb-9">
          <Link aria-label="navigate to Homepage" to={shelterHomePath}>
            Home
          </Link>
          <Link aria-label="navigate to About page" to={aboutUsPath}>
            About Us
          </Link>
          <Link aria-label="navigate to Terms of Service page" to="">
            Terms of Service
          </Link>
          <Link aria-label="navigate to Privacy Policy page" to="">
            Privacy Policy
          </Link>
        </div>
      </div>
      <div className="mt-12 border-t-[0.5px] border-white pt-6 flex justify-end">
        <div className="text-xs">
          © 2025 Better Angels Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
