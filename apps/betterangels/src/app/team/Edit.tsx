import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  Button,
  Input,
  StatusBadge,
  TextBold,
  TextRegular,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

type TInvitedUsers = {
  name: string;
  status: 'Pending' | 'Accepted';
};

const INVITED_USERS: TInvitedUsers[] = [
  {
    name: 'Phillip Smith',
    status: 'Pending',
  },
  {
    name: 'Cameron Williamson',
    status: 'Accepted',
  },
  {
    name: 'Carter Pelohak',
    status: 'Accepted',
  },
];

interface ITeamEditScreenProps {
  teamId: string | undefined;
  setFlow: Dispatch<SetStateAction<string>>;
}

export default function TeamEditScreen(props: ITeamEditScreenProps) {
  const { setFlow } = props;
  const { control } = useForm({
    defaultValues: {
      description:
        'We provide supervision and review of clinical documentation, including progress notes, treatment plans, assessments, and any other clinical documentation as it arises in the client record in adherence to Medi-Cal and DMH requirements.',
      name: 'Clinical',
    },
  });

  return (
    <>
      <TextBold size="xl" mb="md">
        Edit Clinical Team
      </TextBold>
      <Input mb="md" label="Team Name" control={control} name="name" />
      <Textarea
        mb="md"
        label="Description"
        control={control}
        name="description"
      />
      <TextBold mb="xs">Invited by me</TextBold>
      {INVITED_USERS.map((user, index) => (
        <View
          key={index}
          style={[
            styles.invitedUser,
            {
              borderTopColor: Colors.NEUTRAL_LIGHT,
              borderTopWidth: index === 0 ? 0 : 1,
            },
          ]}
        >
          <TextRegular>{user.name}</TextRegular>
          <View style={{ flexDirection: 'row' }}>
            <StatusBadge title={user.status} />
            <Button
              accessibilityHint={`goes to edit invited user ${user.name}`}
              ml="xs"
              fontSize="sm"
              height="sm"
              variant="secondary"
              title="Edit"
              size="auto"
            />
          </View>
        </View>
      ))}
      <Button
        accessibilityHint="goes to add team members screen"
        onPress={() => setFlow('3')}
        mt="sm"
        mb="xl"
        size="full"
        variant="secondary"
        title="Add Team members"
      />
      <Button
        accessibilityHint="opens the popup to delete this team"
        title="Delete This Team"
        size="full"
        variant="negative"
      />
    </>
  );
}

const styles = StyleSheet.create({
  invitedUser: {
    paddingVertical: Spacings.sm,
    paddingRight: Spacings.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
