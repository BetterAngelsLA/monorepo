import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { RelationshipTypeEnum } from '../../../apollo';
import {
  enumDisplayGender,
  enumDisplayRelevant,
} from '../../../static/enumDisplayMapping';
import { IProfileSectionProps } from './types';

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <View>
    <TextRegular size="xs">{label}</TextRegular>
    <TextMedium size="sm">{value || ''}</TextMedium>
  </View>
);

export default function HouseholdMembers(props: IProfileSectionProps) {
  const { expanded, setExpanded, client } = props;

  const isHouseholdMembers = expanded === 'Household';

  return (
    <Accordion
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isHouseholdMembers ? null : 'Household');
      }}
      mb="xs"
      title="Household"
    >
      {isHouseholdMembers && (
        <View
          style={{
            height: isHouseholdMembers ? 'auto' : 0,
            overflow: 'hidden',
            gap: Spacings.xs,
          }}
        >
          {client?.clientProfile.householdMembers?.map((householdMember) => (
            <CardWrapper key={householdMember.id}>
              <View style={{ gap: Spacings.sm }}>
                <TextRegular size="sm">
                  {householdMember.relationshipToClient &&
                    enumDisplayRelevant[householdMember.relationshipToClient]}
                </TextRegular>
                {householdMember.relationshipToClient ===
                  RelationshipTypeEnum.Other && (
                  <InfoRow
                    label="Type of Relationship"
                    value={householdMember.relationshipToClientOther}
                  />
                )}
                <InfoRow label="Name" value={householdMember.name} />
                <InfoRow
                  label="Gender"
                  value={
                    householdMember.gender &&
                    enumDisplayGender[householdMember.gender]
                  }
                />
                <InfoRow
                  label="Date of Birth"
                  value={householdMember.dateOfBirth}
                />
              </View>
            </CardWrapper>
          ))}
        </View>
      )}
    </Accordion>
  );
}
