import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  H1,
  H4,
  StatusBadge,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
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

interface ITeamMainScreenProps {
  teamId: string | undefined;
  setFlow: Dispatch<SetStateAction<string>>;
}

export default function TeamMainScreen(props: ITeamMainScreenProps) {
  const { setFlow } = props;
  return (
    <>
      <View style={styles.headerContainer}>
        <H1>Clinical Team</H1>
        <BodyText
          onPress={() => setFlow('2')}
          color={Colors.PRIMARY_LIGHT}
          textDecorationLine="underline"
        >
          Edit
        </BodyText>
      </View>
      <H4 mb="sm">Description</H4>
      <BodyText mb="md">
        We provide supervision and review of clinical documentation, including
        progress notes, treatment plans, assessments, and any other clinical
        documentation as it arises in the client record in adherence to Medi-Cal
        and DMH requirements.
      </BodyText>
      <H4 mb="xs">Invited by me</H4>
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
          <BodyText>{user.name}</BodyText>
          <StatusBadge title={user.status} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  invitedUser: {
    paddingVertical: Spacings.sm,
    paddingRight: Spacings.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
