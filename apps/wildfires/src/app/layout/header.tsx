import { BetterAngelsLogoIcon, MenuIcon } from '@monorepo/react/icons';
import { ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
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
    'md:h-[104px]',
    'text-white',
    'relative',
    'z-30',
    className,
  ];

  return (
    <>
      <header className={mergeCss(parentCss)}>
        <Link to="/" className="flex items-center">
          <BetterAngelsLogoIcon className="h-7 sm:h-10 text-brand-sky-blue fill-current" />
          <div className="text-white flex ml-2 text-xl md:text-4xl">
            <div className="font-normal">LA Disaster Relief Navigator</div>
          </div>
        </Link>
        {/* Desktop */}
        <div className="flex items-center font-bold">
          <Link className="hidden md:inline-block mr-8" to="/about">
            About LA Disaster Relief Navigator
          </Link>
          <div className="md:mr-12" id="google_translate_element"></div>
          <a
            target="_blank"
            href="https://www.pledge.to/widgets/donate/JS11PeUKJh7pCqZC"
            className="hidden md:inline-block border-2 border-brand-yellow rounded-full py-1 px-7 hover:bg-brand-yellow hover:text-black"
            rel="noreferrer"
          >
            Donate
          </a>
          <div className="flex md:hidden items-center font-bold gap-7">
            <div
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-10 w-10 flex items-center justify-center"
            >
              <MenuIcon className="h-6 w-6" fill="white" />
            </div>
          </div>
        </div>
        {/* Mobile */}

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
