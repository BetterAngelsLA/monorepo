import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { Accordion, TextButton } from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import {
  CreateClientProfileInput,
  UpdateClientProfileInput,
} from '../../../apollo';
import Household from './Household';

interface IHouseholdMembersProps {
  expanded: undefined | string | null;
  setExpanded: (expanded: undefined | string | null) => void;
  scrollRef: RefObject<ScrollView>;
}

export default function HouseholdMembers(props: IHouseholdMembersProps) {
  const { scrollRef, expanded, setExpanded } = props;

  const { control } = useFormContext<
    UpdateClientProfileInput | CreateClientProfileInput
  >();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'householdMembers',
  });

  const isHouseholdMembers = expanded === 'Household';

  return (
    <Accordion
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isHouseholdMembers ? null : 'Household');
      }}
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
          {fields.map((_, index) => (
            <Household remove={remove} key={index} index={index} />
          ))}
          <View style={{ alignItems: 'flex-start' }}>
            <TextButton
              onPress={() => append({ name: '' })}
              title="Add Household"
              color={Colors.PRIMARY}
              fontSize="sm"
              accessibilityLabel={'add Household member'}
              accessibilityHint={'add Household member'}
            />
          </View>
        </View>
      )}
    </Accordion>
  );
}
