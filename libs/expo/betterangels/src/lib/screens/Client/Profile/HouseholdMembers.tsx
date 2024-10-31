import { Spacings } from '@monorepo/expo/shared/static';
import {
  Accordion,
  CardWrapper,
  TextBold,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { RelationshipTypeEnum } from '../../../apollo';
import { clientHouseholdMemberEnumDisplay } from '../../../static/enumDisplayMapping';
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
          {client?.clientProfile.householdMembers?.map((householdMember) => {
            const householdMemberData = [
              {
                label: 'Name',
                value: householdMember.name,
              },
              {
                label: 'Gender',
                value: householdMember.displayGender,
              },
              {
                label: 'Date of Birth',
                value: householdMember.dateOfBirth
                  ? format(new Date(householdMember.dateOfBirth), 'MM/dd/yyyy')
                  : '',
              },
            ];
            return (
              <CardWrapper key={householdMember.id}>
                <View style={{ gap: Spacings.sm }}>
                  <TextBold size="sm">
                    {householdMember.relationshipToClient &&
                      clientHouseholdMemberEnumDisplay[
                        householdMember.relationshipToClient
                      ]}
                  </TextBold>
                  {householdMember.relationshipToClient ===
                    RelationshipTypeEnum.Other && (
                    <InfoRow
                      label="Type of Relationship"
                      value={householdMember.relationshipToClientOther}
                    />
                  )}
                  {householdMemberData
                    .filter(({ value }) => value)
                    .map(({ label, value }) => (
                      <InfoRow key={label} label={label} value={value} />
                    ))}
                </View>
              </CardWrapper>
            );
          })}
        </View>
      )}
    </Accordion>
  );
}
