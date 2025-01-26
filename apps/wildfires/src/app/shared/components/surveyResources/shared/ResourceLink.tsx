import { WFLinkIcon } from '@monorepo/react/icons';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  title: string;
  className?: string;
  href: string;
  target?: '_blank' | '_self';
};

export function ResourceLink(props: IProps) {
  const { title, href, target = '_blank', className } = props;

  const parentCss = ['flex', className];

  if (!href) {
    return null;
  }

  return (
    <a
      aria-label={`open ${title} resource link in new tab`}
      className={mergeCss(parentCss)}
      href={href}
      target={target}
    >
      <div className="font-bold">Visit Resource Site</div>

      <WFLinkIcon className="h-6 ml-[10px]" />
    </a>
  );
}
