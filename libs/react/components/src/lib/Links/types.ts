import { ReactElement } from 'react';

export type TLinkType = 'link' | 'email' | 'tel';

export type IconPosition = 'before' | 'after';

export type TLink = {
  href: string;
  type?: TLinkType;
  label?: string | null;
  className?: string;
  openExternal?: boolean;
  icon?: ReactElement | boolean;
  iconPosition?: IconPosition;
  defaultIconClassName?: string;
};
