import useSnackbar from '../../../../../hooks/snackbar/useSnackbar';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';
import { TClientProfile } from '../../types';
import { getAddressActions, getEmailActions } from './contactActions';
import { ContactInfoRow } from './ContactInfoRow';
import { PhoneNumberRows } from './PhoneNumberRows';
import { PreferredCommunicationRow } from './PreferredCommunicationRow';
import { SocialMediaRows } from './SocialMediaRows';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function ContactInfoCard(props: TProps) {
  const { clientProfile } = props;
  const { showSnackbar } = useSnackbar();

  const {
    email,
    mailingAddress,
    phoneNumbers,
    preferredCommunication,
    residenceAddress,
    socialMediaProfiles,
  } = clientProfile || {};

  const content: TClientProfileCardItem[] = [
    {
      header: ['Residence Address'],
      rows: [
        [
          residenceAddress ? (
            <ContactInfoRow
              menuTitle="Address"
              triggerAccessibilityLabel="Residence address actions"
              value={residenceAddress}
              actions={getAddressActions(residenceAddress, { showSnackbar })}
            />
          ) : null,
        ],
      ],
    },
    {
      header: ['Personal Mailing Address'],
      rows: [
        [
          mailingAddress ? (
            <ContactInfoRow
              menuTitle="Address"
              triggerAccessibilityLabel="Personal mailing address actions"
              value={mailingAddress}
              actions={getAddressActions(mailingAddress, { showSnackbar })}
            />
          ) : null,
        ],
      ],
    },
    {
      header: ['Phone Number(s)'],
      rows: PhoneNumberRows({ numbers: phoneNumbers }),
    },
    {
      header: ['Email Address'],
      rows: [
        [
          email ? (
            <ContactInfoRow
              menuTitle="Email address"
              triggerAccessibilityLabel="Email address actions"
              value={email}
              actions={getEmailActions(email, { showSnackbar })}
            />
          ) : null,
        ],
      ],
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
