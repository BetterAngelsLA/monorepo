import { View } from 'react-native';
import {
  ClientProfileCard,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { getPhoneNumberRows } from './phoneNumbers';
import { getPreferredCommunicationRow } from './preferredCommunication';
import { getSocialMediaRows } from './socialMedia';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ContactInfo(props: TProps) {
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
      rows: getPhoneNumberRows({ numbers: phoneNumbers }),
    },
    {
      header: ['Email Address'],
      rows: [[email]],
    },
    {
      header: ['Social Media'],
      rows: getSocialMediaRows({ medias: socialMediaProfiles || [] }),
    },
    {
      header: ['Preferred Communication'],
      rows: [
        getPreferredCommunicationRow({
          communications: preferredCommunication,
        }),
      ],
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit contact information',
        }}
      />
    </View>
  );
}
