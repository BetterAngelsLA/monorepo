import { mergeCss } from '../../../utils/styles/mergeCss';

const DONATE_HREF = 'https://www.pledge.to/better-angels-emergency-assistance-fund';

type IProps = {
  className?: string;
};

export function DonateButton(props: IProps) {
  const { className } = props;

  const parentCss = [
    'flex',
    'justify-center',
    'items-center',
    'border-2',
    'border-brand-yellow',
    'rounded-full',
    'py-1',
    'px-7',
    'hover:bg-brand-yellow',
    'hover:text-black',
    className,
  ];

  return (
    <a
      className={mergeCss(parentCss)}
      target="_blank"
      href={DONATE_HREF}
      rel="noreferrer"
    >
      Donate
    </a>
  );
}
