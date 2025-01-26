import { WFLinkIcon } from '@monorepo/react/icons';
import { mergeCss } from '../../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  href: string;
  external?: boolean;
};

export function ResourceLink(props: IProps) {
  const { href, external, className } = props;

  const parentCss = ['flex', className];

  const target = external ? '_blank' : '_self';

  if (!href) {
    return null;
  }

  return (
    <a className={mergeCss(parentCss)} href={href} target={target}>
      <div className="font-bold">Visit Resource Site</div>

      <WFLinkIcon className="h-6 ml-[10px]" />
    </a>
  );
}
