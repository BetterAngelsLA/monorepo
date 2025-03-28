import {
  CallIcon,
  ChatBubbleIcon,
  EmailIcon,
  FacebookIcon,
  IIconProps,
  InstagramIcon,
  LinkedinIcon,
  WhatsappIcon,
} from '@monorepo/expo/shared/icons';
import { ComponentType } from 'react';

export type TPreferredCommunication =
  | 'CALL'
  | 'EMAIL'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'TEXT'
  | 'WHATSAPP';

const Icons: Record<TPreferredCommunication, ComponentType<IIconProps>> = {
  CALL: CallIcon,
  EMAIL: EmailIcon,
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedinIcon,
  TEXT: ChatBubbleIcon,
  WHATSAPP: WhatsappIcon,
};

interface TProps extends IIconProps {
  type: TPreferredCommunication;
}

export function PreferrredCommunicationIcon(props: TProps) {
  const { type, ...rest } = props;

  const IconComponent = Icons[type];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...rest} />;
}
