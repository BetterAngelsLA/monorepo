import {
  FacebookIcon,
  IIconProps,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  WhatsappIcon,
} from '@monorepo/expo/shared/icons';
import { ComponentType } from 'react';

export type TSocialMediaType =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'WHATSAPP';

const socialIcons: Record<TSocialMediaType, ComponentType<IIconProps>> = {
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedinIcon,
  TIKTOK: TiktokIcon,
  WHATSAPP: WhatsappIcon,
};

interface TProps extends IIconProps {
  type: TSocialMediaType;
}

export function SocialMediaIcon(props: TProps) {
  const { type, ...rest } = props;

  const IconComponent = socialIcons[type];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...rest} />;
}
