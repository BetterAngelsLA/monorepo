import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { PhoneNumberRows } from './PhoneNumberRows';
import { PreferredCommunicationRow } from './PreferredCommunicationRow';
import { SocialMediaRows } from './SocialMediaRows';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ContactInfoCard(props: TProps) {
  const { clientProfile } = props;

  const {
    mailingAddress,
    phoneNumbers,
    preferredCommunication,
    residenceAddress,
    socialMediaProfiles,
    user,
  } = clientProfile || {};

  const email = user?.email;

  const content: TClientProfileCardItem[] = [
    {
      header: ['Residence Address'],
      rows: [[residenceAddress]],
    },
    {
      header: ['Personal Mailing Address'],
      rows: [[mailingAddress]],
    },
    {
      header: ['Phone Number(s)'],
      rows: PhoneNumberRows({ numbers: phoneNumbers }),
    },
    {
      header: ['Email Address'],
      rows: [[email]],
    },
    {
      header: ['Social Media'],
      rows: SocialMediaRows({ medias: socialMediaProfiles || [] }),
    },
    {
      header: ['Preferred Communication'],
      rows: [
        PreferredCommunicationRow({
          communications: preferredCommunication,
        }),
      ],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
