import { mergeCss } from '../../utils/styles/mergeCss';
import { AboutLink } from './shared/AboutLink';
import { DonateButton } from './shared/DonateButton';
import { GoogleTranslateBtn } from './shared/GoogleTranslateBtn';

type IProps = {
  className?: string;
};

export function MenuDesktop(props: IProps) {
  const { className } = props;

  const parentCss = [
    'flex',
    'items-center',
    'font-bold',
    'justify-end',
    'w-full',
    'gap-8',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <AboutLink className="hidden lg:flex" />
      <GoogleTranslateBtn />
      <DonateButton className="hidden lg:flex" />
    </div>
  );
}
