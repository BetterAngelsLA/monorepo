import { mergeCss } from '@monorepo/react/shared';
import { ResolvedIcon } from './components';
import { TLink } from './types';
import { toTypedHref } from './utils/toTypedHref';

export function TextLink(props: TLink) {
  const {
    href,
    type = 'link',
    label,
    openExternal,
    icon,
    iconPosition = 'after',
    className,
    defaultIconClassName,
    iconW,
    iconH,
    iconColor,
  } = props;

  const typedHref = toTypedHref(href, type);

  const parentCss = [
    'inline-flex',
    'items-center',
    'gap-1',
    'underline',
    'lg:no-underline',
    'hover:underline',
    'transition-all',
    'active:bg-[#E8ECF2]',
    'active:opacity-70',
    className,
  ];

  const isExternalTarget = type === 'link' && openExternal;
  const target = isExternalTarget ? '_blank' : undefined;

  const renderedIcon = (
    <ResolvedIcon
      icon={icon}
      type={type}
      openExternal={openExternal}
      className={defaultIconClassName}
      width={iconW}
      height={iconH}
      color={iconColor}
    />
  );

  return (
    <a
      href={typedHref}
      rel={isExternalTarget ? 'noopener noreferrer' : undefined}
      target={target}
      className={mergeCss(parentCss)}
    >
      {iconPosition === 'before' && renderedIcon}
      <span>{label || href}</span>
      {iconPosition === 'after' && renderedIcon}
    </a>
  );
}
