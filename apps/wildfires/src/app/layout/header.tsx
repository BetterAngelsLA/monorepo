import { ReactElement } from 'react';
import { MenuDesktop } from '../shared/components/navBar/MenuDesktop';
import { HomeLink } from '../shared/components/navBar/shared/HomeLink';
import { MenuBtnMobile } from '../shared/components/navBar/shared/MenuBtnMobile';
import { mergeCss } from '../shared/utils/styles/mergeCss';

type IParams = {
  className?: string;
};
export function Header(props: IParams): ReactElement {
  const { className = '' } = props;

  const parentCss = [
    'w-full',
    'mx-auto',
    'flex',
    'items-center',
    'justify-between',
    'h-[72px]',
    'md:h-[104px]',
    'text-white',
    'relative',
    className,
  ];

  return (
    <>
      <header className={mergeCss(parentCss)}>
        <HomeLink className="h-8 md:h-12" />
        <MenuDesktop className="hidden lg:flex" />
        <MenuBtnMobile className="block lg:hidden" />
      </header>
    </>
  );
}
