import { mergeCss } from '@monorepo/react/shared';
import {
  ExternalLink,
  LinkIcon,
  Mail,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import { ReactElement, isValidElement } from 'react';
import { TLinkType } from '../types';

const iconsByType: Record<TLinkType, LucideIcon> = {
  link: LinkIcon,
  email: Mail,
  tel: Phone,
};

type TProps = {
  icon?: ReactElement | boolean;
  type?: TLinkType;
  openExternal?: boolean;
  className?: string;
};

export function ResolvedIcon(props: TProps): ReactElement | null {
  const { icon, type = 'link', openExternal, className } = props;

  if (isValidElement(icon)) {
    return icon;
  }

  if (!icon) {
    return null;
  }

  const parentCss = ['text-xs', 'text-red-500-x', 'h-3'];

  if (openExternal && type === 'link') {
    return (
      <ExternalLink className={mergeCss([parentCss, className])} aria-hidden />
    );
  }

  const DefaultIcon = iconsByType[type];

  return (
    <DefaultIcon className={mergeCss([parentCss, className])} aria-hidden />
  );
}
