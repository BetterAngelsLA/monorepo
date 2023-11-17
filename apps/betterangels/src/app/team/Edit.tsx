import { Colors } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  H1,
  H4,
  Input,
  StatusBadge,
  Textarea,
} from '@monorepo/expo/shared/ui-components';
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
  setIsEdit: (e: boolean) => void;
}

export default function TeamEditScreen(props: ITeamEditScreenProps) {
  const { setIsEdit, teamId } = props;
  const { control } = useForm({
    defaultValues: {
      description:
        'We provide supervision and review of clinical documentation, including progress notes, treatment plans, assessments, and any other clinical documentation as it arises in the client record in adherence to Medi-Cal and DMH requirements.',
      name: 'Clinical',
    },
  });

  return (
    <>
      <H1 mb={24}>Edit Clinical Team</H1>
      <Input
        componentStyle={{ marginBottom: 24 }}
        label="Team Name"
        control={control}
        name="name"
      />
      <Textarea
        height={200}
        label="Description"
        control={control}
        name="description"
      />
      <H4 mt={24} mb={8}>
        Invited by me
      </H4>
      {INVITED_USERS.map((user, index) => (
        <View
          key={index}
          style={[
            styles.invitedUser,
            {
              borderTopColor: Colors.LIGHT_GRAY,
              borderTopWidth: index === 0 ? 0 : 1,
            },
          ]}
        >
          <BodyText>{user.name}</BodyText>
          <View style={{ flexDirection: 'row' }}>
            <StatusBadge title={user.status} />
            <Button
              ml={10}
              fontSize={14}
              height={32}
              variant="secondary"
              title="Edit"
              size="auto"
            />
          </View>
        </View>
      ))}
      <Button
        mt={16}
        mb={84}
        size="full"
        variant="secondary"
        title="Add Team members"
      />
      <Button title="Delete This Team" size="full" variant="negative" />
    </>
  );
}

const styles = StyleSheet.create({
  invitedUser: {
    paddingVertical: 16,
    paddingRight: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
