import { mergeCss } from '../../utils';
import { ChevronLeftIcon } from '@monorepo/react/icons';

type TProps = {
  open?: boolean;
  className?: string;
  buttonClassname?: string;
  onClick: () => void;
};

export function SidebarToggleBtn(props: TProps) {
  const { open, onClick, className, buttonClassname } = props;

  const parentCss = ['shadow-lg', 'rounded-full', 'text-primary-20', className];

  const buttonCss = [
    'flex',
    'h-8',
    'w-8',
    'rounded-full',
    'bg-white',
    'justify-center',
    'items-center',
    'cursor-pointer',
    'transition',
    'duration-300',
    'ease-in-out',
    open ? 'rotate-0' : 'rotate-180',
    buttonClassname,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <button
        aria-label="toggle sidebar"
        className={mergeCss(buttonCss)}
        onClick={onClick}
      >
        <ChevronLeftIcon className="h-3" />
      </button>
    </div>
  );
}
