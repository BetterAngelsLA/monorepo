import {
  AddressLink,
  InstagramLink,
  TextLink,
  TLinkType,
} from '@monorepo/react/components';
import { mergeCss, toInstagramUrl, toMapsUrl } from '@monorepo/react/shared';
import { ReactElement } from 'react';
import { TContactInfoRow, TLinkInfoType } from './types';

const linkTypeMap: Record<TLinkInfoType, TLinkType> = {
  website: 'link',
  instagram: 'link',
  email: 'email',
  phone: 'tel',
};

/**
 * Resolves a row to the link it will actually render, or `null` when there's
 * nothing linkable (no href, a value that isn't a real Instagram link, or a
 * location with neither usable coordinates nor an address).
 *
 * Visibility is derived from this same result, so a row can never render with
 * no link inside it.
 */
function resolveContactLink(props: TContactInfoRow): ReactElement | null {
  if (props.type === 'location') {
    const latitude = props.location?.latitude;
    const longitude = props.location?.longitude;
    const place = props.location?.place;

    if (!toMapsUrl({ latitude, longitude, address: place })) {
      return null;
    }

    return (
      <AddressLink
        latitude={latitude}
        longitude={longitude}
        address={place}
        label={props.label || 'address'}
        openExternal={true}
      />
    );
  }

  if (props.type === 'instagram') {
    if (!toInstagramUrl(props.href)) {
      return null;
    }

    return (
      <InstagramLink
        handleOrHref={props.href}
        label={props.label}
        openExternal={true}
      />
    );
  }

  if (!props.href) {
    return null;
  }

  return (
    <TextLink
      type={linkTypeMap[props.type]}
      href={props.href}
      label={props.label}
      openExternal={true}
    />
  );
}

export function ContactInfoRow(props: TContactInfoRow) {
  const { icon, className } = props;

  const resolvedLink = resolveContactLink(props);

  if (!resolvedLink) {
    return null;
  }

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

  return (
    <div className={mergeCss(parentCss)}>
      {resolvedLink}
      {icon}
    </div>
  );
}
