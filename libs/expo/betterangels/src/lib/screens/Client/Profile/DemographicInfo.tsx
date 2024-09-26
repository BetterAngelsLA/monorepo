import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import {
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
    return `${feet}'${remainingInches}"`;
  }

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isDemographicInfo ? null : 'Demographic Info');
      }}
      mb="xs"
      title="Demographic Info"
    >
      {isDemographicInfo && (
        <View
          style={{
            height: isDemographicInfo ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          <CardWrapper>
            <View style={{ gap: Spacings.lg }}>
              <InfoRow
                label="Gender"
                value={client?.clientProfile.displayGender}
              />
              <InfoRow
                label="Pronouns"
                value={client?.clientProfile.displayPronouns}
              />
              <InfoRow
                label="Race"
                value={
                  client?.clientProfile.race &&
                  enumDisplayRace[client?.clientProfile.race]
                }
              />
              <InfoRow
                label="City of Birth"
                value={client?.clientProfile.placeOfBirth}
              />
              <InfoRow
                label="Height"
                value={
                  client?.clientProfile.heightInInches
                    ? convertToFeetAndInches(
                        client?.clientProfile.heightInInches
                      )
                    : ''
                }
              />
              <InfoRow
                label="Eye Color"
                value={
                  client?.clientProfile.eyeColor &&
                  enumDisplayEyeColor[client?.clientProfile.eyeColor]
                }
              />
              <InfoRow
                label="Hair Color"
                value={
                  client?.clientProfile.hairColor &&
                  enumDisplayHairColor[client?.clientProfile.hairColor]
                }
              />
              <View>
                <TextRegular size="xs">Physical Description</TextRegular>
                <TextBold size="sm">
                  {client?.clientProfile.physicalDescription || ''}
                </TextBold>
              </View>

              <InfoRow
                label="Marital Status"
                value={
                  client?.clientProfile.maritalStatus &&
                  enumDisplayMaritalStatus[client?.clientProfile.maritalStatus]
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
