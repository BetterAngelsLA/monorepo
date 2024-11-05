import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';

import { format } from 'date-fns';
import {
  enumDisplayHmisAgency,
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDisplayYesNoPreferNot,
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
    <TextBold size="sm">{value}</TextBold>
  </View>
);

export default function PersonalInfo(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isPersonalInfo = expanded === 'Personal Info';

  const fullName = `${client?.clientProfile.user.firstName ?? ''} ${
    client?.clientProfile.user.lastName ?? ''
  }`.trim();

  const formattedDob = client?.clientProfile.dateOfBirth
    ? format(client?.clientProfile.dateOfBirth, 'MM/dd/yyyy')
    : null;
  const clientAge = client?.clientProfile.age;
  const displayDob =
    formattedDob && clientAge ? `${formattedDob} (${clientAge})` : null;

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
      label: 'Date of Birth',
      value: displayDob,
    },
    {
      label: 'Preferred Language',
      value:
        client?.clientProfile.preferredLanguage &&
        enumDisplayLanguage[client.clientProfile.preferredLanguage],
    },
    {
      label: 'Veteran Status',
      value:
        client?.clientProfile.veteranStatus &&
        enumDisplayYesNoPreferNot[client.clientProfile.veteranStatus],
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
              {!!client?.clientProfile.livingSituation && (
                <InfoRow
                  label="Living Situation"
                  value={
                    client.clientProfile.livingSituation &&
                    enumDisplayLivingSituation[
                      client.clientProfile.livingSituation
                    ]
                  }
                />
              )}
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
