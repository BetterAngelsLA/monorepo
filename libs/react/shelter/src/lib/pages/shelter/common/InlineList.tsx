import { mergeCss } from '@monorepo/react/shared';

type TProps = {
  items: string[] | null;
  title?: string;
  className?: string;
  titleClassName?: string;
};

export function InlineList(props: TProps) {
  const { title, items, className, titleClassName } = props;

  const visibleItems = items?.filter((i) => !!i);

  if (!visibleItems?.length) {
    return null;
  }

  const parentCss = [className];

  const titleCss = [
    'mr-2',
    'font-semibold',
    'whitespace-nowrap',
    titleClassName,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      {!!title && <span className={mergeCss(titleCss)}>{title}</span>}
      <span>{visibleItems.join(', ')}</span>
    </div>
  );
}
