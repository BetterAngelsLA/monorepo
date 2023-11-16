import {
  BodyText,
  Button,
  H1,
  Input,
  SearchableDropdown,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface ITeamEditScreenProps {
  teamId: string | undefined;
  setFlow: Dispatch<SetStateAction<string>>;
}

export default function TeamAddMemberScreen(props: ITeamEditScreenProps) {
  const { setFlow, teamId } = props;
  const { control } = useForm();

  return (
    <>
      <H1 mb={16}>Add Team Members</H1>
      <BodyText mb={22}>
        You can send an invitation by filling out their information down below.
        They will receive the invite via email so they can sign up later on.
      </BodyText>
      <Button
        disabled
        mb={26}
        size="full"
        variant="primary"
        title="View Invited Members"
      />
      <Input
        componentStyle={{ marginBottom: 16 }}
        label="First Name"
        control={control}
        name="firstName"
      />
      <Input
        componentStyle={{ marginBottom: 16 }}
        label="Last Name"
        control={control}
        name="lastName"
      />
      <SearchableDropdown
        setExternalValue={(value) => console.log(value)}
        data={['Case Manager', 'Client Supportive Services']}
        label="Title"
      />
      {/* TODO: here missing Select component*/}
      <Input
        componentStyle={{ marginBottom: 16, marginTop: 16 }}
        label="Email Address"
        control={control}
        name="email"
      />
      <View style={styles.otherTeam}>
        <Input
          componentStyle={{ marginBottom: 16, flex: 1 }}
          label="Other Team Name"
          control={control}
          name="otherTeam"
        />
        <Button
          ml={8}
          size="auto"
          variant="secondary"
          title="Add"
          height="sm"
        />
      </View>
      {/* TODO: here missing Tag component*/}
      <Button mt={53} variant="primary" size="full" title="Send Invite" />
    </>
  );
}

const styles = StyleSheet.create({
  otherTeam: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
