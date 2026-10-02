import {
  AddressLink,
  InstagramLink,
  Link,
  TLinkType,
} from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { TContactInfoRow, TLinkInfoType } from './types';

const linkTypeMap: Record<TLinkInfoType, TLinkType> = {
  website: 'link',
  instagram: 'link',
  email: 'email',
  phone: 'tel',
};

/** The location row points at coordinates; every other row points at an href. */
function hasTarget(props: TContactInfoRow): boolean {
  if (props.type === 'location') {
    return Boolean(props.location);
  }

  return Boolean(props.href);
}

function ContactInfoValue(props: TContactInfoRow) {
  if (props.type === 'instagram') {
    return (
      <InstagramLink
        handleOrHref={props.href}
        label={props.label}
        openExternal={true}
      />
    );
  }

  if (props.type === 'location') {
    return (
      <AddressLink
        latitude={props.location?.latitude}
        longitude={props.location?.longitude}
        address={props.location?.place}
        label={props.label}
        openExternal={true}
      />
    );
  }

  return (
    <Link
      type={linkTypeMap[props.type]}
      href={props.href ?? ''}
      label={props.label}
      openExternal={true}
    />
  );
}

export function ContactInfoRow(props: TContactInfoRow) {
  const { icon, className } = props;

  const parentCss = [
    'border-b',
    'border-neutral-90',
    'last:border-b-0',
    'flex',
    'items-center',
    'justify-between',
    'px-6',
    'py-4',
    'gap-1',
    className,
  ];

  if (!hasTarget(props)) {
    return null;
  }

  return (
    <div className={mergeCss(parentCss)}>
      <ContactInfoValue {...props} />
      {icon}
    </div>
  );
}
