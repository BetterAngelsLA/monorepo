import { mergeCss } from '@monorepo/react/components';
import { FaceFrownIcon } from '@monorepo/react/icons';

type Props = {
  className?: string;
  title?: string;
  bodyText?: string;
};

export function ErrorListView(props: Props) {
  const {
    className,
    title = 'Sorry, something went wrong.',
    bodyText = "There was an error retrieving the data. Rest assured, we're working on it.",
  } = props;

  const containerCss = [
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'py-[100px]',
    className,
  ];

  const iconWrapperCss = [
    'flex',
    'items-center',
    'justify-center',
    'h-[90px]',
    'w-[90px]',
    'rounded-full',
    'bg-primary-95',
    'mb-6',
  ];

  const messagesCss = ['flex', 'flex-col', 'items-center', 'px-6'];

  const titleCss = [
    'mb-4',
    'text-sm',
    'font-semibold',
    'leading-[21px]',
    'text-neutral-30',
  ];

  const bodyTextCss = [
    'text-sm',
    'leading-[21px]',
    'text-neutral-40',
    'text-center',
  ];

  return (
    <div className={mergeCss(containerCss)}>
      <div className={mergeCss(iconWrapperCss)}>
        <FaceFrownIcon />
      </div>

      <div className={mergeCss(messagesCss)}>
        <h3 className={mergeCss(titleCss)}>{title}</h3>

        <p className={mergeCss(bodyTextCss)}>{bodyText}</p>
      </div>
    </div>
  );
}
