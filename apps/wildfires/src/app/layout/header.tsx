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
    'h-[104px]',
    'md:h-[110px]',
    'text-white',
    'relative',
    className,
  ];

  return (
    <header className={mergeCss(parentCss)}>
      <HomeLink className="min-w-[230px] w-[230px] md:w-[300px] md:min-w-[300px]" />
      <MenuDesktop />
      <MenuBtnMobile className="block ml-4 lg:hidden" />
    </header>
  );
}
