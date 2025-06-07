import { mergeCss } from '@monorepo/react/components';

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

  const parentCss = ['flex', 'flex-row', 'gap-2', className];

  const titleCss = ['font-semibold', titleClassName];

  return (
    <div className={mergeCss(parentCss)}>
      {!!title && <div className={mergeCss(titleCss)}>{title}</div>}
      <div>{visibleItems.join(', ')}</div>
    </div>
  );
}
