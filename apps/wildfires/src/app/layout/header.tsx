import { GlobeIcon, MenuIcon } from '@monorepo/react/icons';
import { ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import LADR_LOGO from '../../assets/images/la_disaster_relief_navigator_logo.png';
import { mergeCss } from '../shared/utils/styles/mergeCss';
type IParams = {
  className?: string;
};
export function Header(props: IParams): ReactElement {
  const { className = '' } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const parentCss = [
    'w-full',
    'mx-auto',
    'flex',
    'items-center',
    'justify-between',
    'h-[104px]',
    'md:h-[78px]',
    'text-white',
    'relative',
    'z-30',
    className,
  ];

  return (
    <>
      <header className={mergeCss(parentCss)}>
        <Link to="/" className="flex items-center">
          <img
            src={LADR_LOGO}
            alt="LA Disaster Relief Navigator"
            className="w-[250px]"
          />
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center font-bold">
          <p className="mr-8">Select Language</p>
          <Link className="mr-12" to="/about">
            About LA Disaster Relief Navigator
          </Link>
          <a
            target="_blank"
            href="https://www.pledge.to/widgets/donate/JS11PeUKJh7pCqZC"
            className="border-2 border-brand-yellow rounded-full py-1 px-7 hover:bg-brand-yellow hover:text-black"
            rel="noreferrer"
          >
            Donate
          </a>
        </div>
        {/* Mobile */}
        <div className="flex md:hidden items-center font-bold gap-7">
          <div className="h-10 w-10 flex items-center justify-center">
            <GlobeIcon className="h-6 w-6" stroke="white" />
          </div>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-10 w-10 flex items-center justify-center"
          >
            <MenuIcon className="h-6 w-6" fill="white" />
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden absolute -left-4 w-[110%] top-full bg-brand-dark-blue p-8 z-20">
            <Link to="/about" className="block mb-6">
              About LA Disaster Relief Navigator
            </Link>
            <a
              target="_blank"
              href="https://www.pledge.to/widgets/donate/JS11PeUKJh7pCqZC"
              className="border-2 border-brand-yellow rounded-full py-1 w-full inline-flex items-center justify-center hover:bg-brand-yellow hover:text-black"
              rel="noreferrer"
            >
              Donate
            </a>
          </div>
        )}
      </header>
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-[rgba(30,51,66,0.5)] bg-cover z-10"
        />
      )}
    </>
  );
}
