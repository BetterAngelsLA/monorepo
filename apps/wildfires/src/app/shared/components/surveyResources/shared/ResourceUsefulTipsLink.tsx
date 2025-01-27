import { LightBulbIcon } from '@monorepo/react/icons';
import { mergeCss } from '../../../utils/styles/mergeCss';
import { ResourceCallout } from './ResourceCallout';

type IProps = {
  className?: string;
  title: string;
  href: string;
  target?: '_blank' | '_self';
};

export function ResourceUsefulTipsLink(props: IProps) {
  const { href, title, target = '_blank', className } = props;

  const parentCss = [className];

  if (!href) {
    return null;
  }

  return (
    <ResourceCallout
      className={mergeCss(parentCss)}
      icon={<LightBulbIcon className="h-6 md:h-8" />}
    >
      <div>
        Please check out these useful
        <a
          aria-label={`open ${title} useful tips in new tab`}
          className="underline underline-offset-2 ml-1"
          href={href}
          target={target}
        >
          tips
        </a>
        .
      </div>
    </ResourceCallout>
  );
}
