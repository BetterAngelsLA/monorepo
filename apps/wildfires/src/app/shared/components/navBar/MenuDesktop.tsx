import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';
import { GoogleTranslateBtn } from './shared/GoogleTranslateBtn';

type IProps = {
  className?: string;
};

export function MenuDesktop(props: IProps) {
  const { className } = props;

  const parentCss = ['flex', 'items-center', 'font-bold', className];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="mx-8 hidden lg:flex" />
      <GoogleTranslateBtn className="mr-8" />
      <DonateButton className="hidden lg:flex text-center" />
    </div>
  );
}
