import { WFLinkIcon } from '@monorepo/react/icons';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  href: string;
  target?: '_blank' | '_self';
};

export function ResourceLink(props: IProps) {
  const { href, target = '_blank', className } = props;

  const parentCss = ['flex', 'items-center', 'gap-2', className];

  if (!href) {
    return null;
  }

  return (
    <a className={mergeCss(parentCss)} href={href} target={target}>
      <div className="font-bold">Visit Resource Site</div>
      <WFLinkIcon className="h-6 min-w-6" />
    </a>
  );
}
