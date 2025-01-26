import { ReactElement } from 'react';
import { MenuDesktop } from '../shared/components/navBar/MenuDesktop';
import { GoogleTranslateBtn } from '../shared/components/navBar/shared/GoogleTranslateBtn';
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
    <header className={mergeCss(parentCss)}>
      <HomeLink className="min-w-[116px] w-[116px] md:w-[260px] md:min-w-[260px]" />
      <MenuDesktop />
      <GoogleTranslateBtn></GoogleTranslateBtn>
      <MenuBtnMobile className="block lg:hidden" />
    </header>
  );
}
