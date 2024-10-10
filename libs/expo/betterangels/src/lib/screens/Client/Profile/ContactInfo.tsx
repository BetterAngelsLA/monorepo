import { PawIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View, ViewStyle } from 'react-native';
import {
  enumDisplayPreferredCommunication,
  enumDisplaySocialMedia,
} from '../../../static/enumDisplayMapping';
import { IProfileSectionProps } from './types';

const InfoCol = ({
  label,
  value,
  row,
}: {
  label: string;
  value?: string | null;
  row?: boolean;
}) => {
  const style: ViewStyle = row
    ? {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }
    : { gap: Spacings.xs };
  return (
    <View style={style}>
      <TextRegular size="sm">{label}</TextRegular>
      <TextBold size="sm">{value}</TextBold>
    </View>
  );
};

export default function ContactInfo(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isContactInfo = expanded === 'Contact Info';

  const addresses = [
    {
      label: 'Residence Address',
      value: client?.clientProfile.residenceAddress,
    },
    {
      label: 'Personal Mailing Address',
      value: client?.clientProfile.mailingAddress,
    },
  ];

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isContactInfo ? null : 'Contact Info');
      }}
      mb="xs"
      title="Contact Info"
    >
      {isContactInfo && (
        <View
          style={{
            height: isContactInfo ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <View style={{ gap: Spacings.lg }}>
              {addresses
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <InfoCol key={label} label={label} value={value} />
                ))}
              {client?.clientProfile.phoneNumbers &&
                client?.clientProfile.phoneNumbers.length > 0 && (
                  <View>
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        marginBottom: Spacings.sm,
                      }}
                    >
                      <TextRegular size="sm">Phone Number(s)</TextRegular>
                      <TextBold size="sm">Primary</TextBold>
                    </View>
                    {client?.clientProfile.phoneNumbers?.map((phoneNumber) => (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        key={phoneNumber.id}
                      >
                        <TextBold size="sm">{phoneNumber.number}</TextBold>
                        <PawIcon />
                      </View>
                    ))}
                  </View>
                )}

              <InfoCol
                row
                label="Email"
                value={client?.clientProfile.user.email}
              />
              {client?.clientProfile.socialMediaProfiles &&
                client?.clientProfile.socialMediaProfiles?.length > 0 && (
                  <View>
                    <TextRegular size="sm" mb="sm">
                      Social Medias
                    </TextRegular>
                    {client?.clientProfile.socialMediaProfiles?.map(
                      (profile) => (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          key={profile.id}
                        >
                          <TextRegular size="sm">
                            {enumDisplaySocialMedia[profile.platform]}
                          </TextRegular>
                          <TextBold size="sm">
                            {profile.platformUserId}
                          </TextBold>
                        </View>
                      )
                    )}
                  </View>
                )}
              {client?.clientProfile.preferredCommunication &&
                client?.clientProfile.preferredCommunication.length > 0 && (
                  <View>
                    <TextRegular size="sm">Preferred Communication</TextRegular>
                    <TextBold textAlign="right" size="sm">
                      {client?.clientProfile.preferredCommunication
                        ?.map(
                          (value) => enumDisplayPreferredCommunication[value]
                        )
                        .join(', ')}
                    </TextBold>
                  </View>
                )}
            </View>
          </CardWrapper>
        </View>
      )}
    </Accordion>
  );
}
