import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
  enumDisplayAdaAccommodationEnum,
  enumDisplayEyeColor,
  enumDisplayHairColor,
  enumDisplayMaritalStatus,
  enumDisplayRace,
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

export default function DemographicInfo(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isDemographicInfo = expanded === 'Demographic Info';

  function convertToFeetAndInches(inches: number | null | undefined): string {
    const feet = Math.floor((inches || 0) / 12);
    const remainingInches = (inches || 0) % 12;
    return `${feet}' ${remainingInches}"`;
  }

  const demographicData = [
    {
      label: 'Gender',
      value: client?.clientProfile.displayGender,
    },
    {
      label: 'Pronouns',
      value: client?.clientProfile.displayPronouns,
    },
    {
      label: 'Race',
      value:
        client?.clientProfile.race &&
        enumDisplayRace[client?.clientProfile.race],
    },
    {
      label: 'Place of Birth',
      value: client?.clientProfile.placeOfBirth,
    },
    {
      label: 'Height',
      value: client?.clientProfile.heightInInches
        ? convertToFeetAndInches(client?.clientProfile.heightInInches)
        : null,
    },
    {
      label: 'Eye Color',
      value:
        client?.clientProfile.eyeColor &&
        enumDisplayEyeColor[client?.clientProfile.eyeColor],
    },
    {
      label: 'Hair Color',
      value:
        client?.clientProfile.hairColor &&
        enumDisplayHairColor[client?.clientProfile.hairColor],
    },
    {
      label: 'Marital Status',
      value:
        client?.clientProfile.maritalStatus &&
        enumDisplayMaritalStatus[client?.clientProfile.maritalStatus],
    },
  ];

  const hasContent =
    demographicData.some(({ value }) => value) ||
    !!client?.clientProfile.physicalDescription ||
    !!client?.clientProfile.adaAccommodation?.length;

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDemographicInfo ? null : 'Demographic Info');
      }}
      mb="xs"
      title="Demographic Info"
    >
      {isDemographicInfo && hasContent && (
        <View
          style={{
            height: isDemographicInfo ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <View style={{ gap: Spacings.lg }}>
              {demographicData
                .filter(({ value }) => value)
                .map(({ label, value }) => (
                  <InfoRow key={label} label={label} value={value} />
                ))}

              {!!client?.clientProfile.physicalDescription && (
                <View>
                  <TextRegular mb="xs" size="sm">
                    Physical Description
                  </TextRegular>
                  <TextBold size="sm">
                    {client?.clientProfile.physicalDescription || ''}
                  </TextBold>
                </View>
              )}
              {!!client?.clientProfile.adaAccommodation?.length && (
                <View>
                  <TextRegular mb="xs" size="sm">
                    ADA Accommodation(s)
                  </TextRegular>
                  <TextBold size="sm">
                    {client.clientProfile.adaAccommodation
                      .map((key) => enumDisplayAdaAccommodationEnum[key])
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

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
