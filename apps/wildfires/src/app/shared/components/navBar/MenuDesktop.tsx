import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';
import { GoogleTranslateBtn } from './shared/GoogleTranslateBtn';

type IProps = {
  className?: string;
};

export function MenuDesktop(props: IProps) {
  const { className } = props;

  const parentCss = ['flex', 'items-center', 'font-bold', 'justify-end', 'w-full', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="mx-4 hidden lg:flex" />
      <GoogleTranslateBtn className="mx-8 lg:mx-8" />
      <DonateButton className="hidden lg:flex mx-2" />
    </div>
  );
}
