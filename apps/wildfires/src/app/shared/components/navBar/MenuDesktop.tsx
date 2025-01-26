import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';
import { GoogleTranslateBtn } from './shared/GoogleTranslateBtn';

type IProps = {
  className?: string;
};

export function MenuDesktop(props: IProps) {
  const { className } = props;

  const parentCss = ['flex', 'items-center', 'justify-end', 'w-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      {/* AboutLink: Hidden on mobile, visible on large screens */}
      <AboutLink className="hidden lg:flex mx-2" />

      {/* GoogleTranslateBtn: Always visible, with extra spacing in smaller screens */}
      <GoogleTranslateBtn className="mx-4 lg:mx-2" />

      {/* DonateButton: Hidden on mobile, visible on large screens */}
      <DonateButton className="hidden lg:flex mx-2" />
    </div>
  );
}
