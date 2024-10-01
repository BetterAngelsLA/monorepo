import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
  enumDisplayHmisAgency,
  enumDisplayLanguage,
  enumDisplayLivingSituation,
} from '../../../static/enumDisplayMapping';
import { IProfileSectionProps } from './types';

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <View style={styles.flexRow}>
    <TextRegular size="sm">{label}</TextRegular>
    <TextBold size="sm">{value || 'N/A'}</TextBold>
  </View>
);

export default function PersonalInfo(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isPersonalInfo = expanded === 'Personal Info';

  const fullName = `${client?.clientProfile.user.firstName ?? ''} ${
    client?.clientProfile.user.lastName ?? ''
  }`.trim();

  const personalData = [
    {
      label: 'Full Name',
      value: fullName,
    },
    {
      label: 'Nick Name',
      value: client?.clientProfile.nickname,
    },
    {
      label: 'DoB',
      value: client?.clientProfile.dateOfBirth,
    },
    {
      label: 'Preferred Language',
      value:
        client?.clientProfile.preferredLanguage &&
        enumDisplayLanguage[client.clientProfile.preferredLanguage],
    },
  ];

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isPersonalInfo ? null : 'Personal Info');
      }}
      mb="xs"
      title="Personal Info"
    >
      {isPersonalInfo && (
        <View
          style={{
            height: isPersonalInfo ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <View style={{ gap: Spacings.lg }}>
              {personalData
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <InfoRow key={label} label={label} value={value} />
                ))}

              {client?.clientProfile.hmisProfiles?.map((hmisProfile) => (
                <InfoRow
                  key={hmisProfile.id}
                  label={
                    enumDisplayHmisAgency[hmisProfile.agency] || 'HMIS Agency'
                  }
                  value={hmisProfile.hmisId}
                />
              ))}

              <InfoRow
                label="Living Situation"
                value={
                  client?.clientProfile.livingSituation &&
                  enumDisplayLivingSituation[
                    client.clientProfile.livingSituation
                  ]
                }
              />
            </View>
          </CardWrapper>
        </View>
      )}
    </Accordion>
  );
}

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
