import { mergeCss } from '@monorepo/react/components';
import { UserSearchIcon } from '@monorepo/react/icons';

type Props = {
  className?: string;
};

export function EmptyListView(props: Props) {
  const { className } = props;

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

  return (
    <div className={mergeCss(containerCss)}>
      <div className={mergeCss(iconWrapperCss)}>
        <UserSearchIcon className="w-12 h-12" />
      </div>

      <div className="mb-2 text-sm">No results</div>

      <div className="text-neutral-40 text-sm">
        Try searching for something else.
      </div>
    </div>
  );
}
