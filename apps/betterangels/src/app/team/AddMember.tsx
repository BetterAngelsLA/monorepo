import { Spacings } from '@monorepo/expo/shared/static';
import {
  BodyText,
  Button,
  H1,
  Input,
  SearchableDropdown,
  Select,
  Tag,
} from '@monorepo/expo/shared/ui-components';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface ITeamEditScreenProps {
  teamId: string | undefined;
  setFlow: Dispatch<SetStateAction<string>>;
}

export default function TeamAddMemberScreen(props: ITeamEditScreenProps) {
  const { setFlow } = props;
  const [tags, setTags] = useState<Array<string>>([]);
  const { control, watch, setValue } = useForm();

  const tag = watch('otherTeam');

  function onAddingTag() {
    setTags([...tags, tag]);
    setValue('otherTeam', '');
  }

  return (
    <>
      <H1 mb="sm">Add Team Members</H1>
      <BodyText mb="md">
        You can send an invitation by filling out their information down below.
        They will receive the invite via email so they can sign up later on.
      </BodyText>
      <Button
        accessibilityHint="opens popup to view already invited members"
        disabled
        mb="md"
        size="full"
        variant="primary"
        title="View Invited Members"
      />
      <Input mb="sm" label="First Name" control={control} name="firstName" />
      <Input mb="sm" label="Last Name" control={control} name="lastName" />
      <SearchableDropdown
        accessibilityHint="searches for the user's role"
        mb="sm"
        setExternalValue={(value) => console.log(value)}
        data={['Case Manager', 'Client Supportive Services']}
        label="Title"
      />
      <Select
        mb="sm"
        placeholder="Select the role"
        label="Roles and permissions"
        data={['Case Manager']}
        setExternalValue={(value) => console.log(value)}
      />
      <Input mb="sm" label="Email Address" control={control} name="email" />
      <View style={styles.otherTeam}>
        <Input
          componentStyle={{ flex: 1 }}
          label="Other Team Name"
          control={control}
          name="otherTeam"
        />
        <View style={{ marginBottom: Spacings.sm }}>
          <Button
            accessibilityHint="adds a tag that comes from other Team Name input"
            onPress={onAddingTag}
            ml="xs"
            size="auto"
            variant="secondary"
            title="Add"
            height="sm"
          />
        </View>
      </View>
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag, idx) => (
            <View
              key={idx}
              style={{ marginHorizontal: 4, marginBottom: Spacings.xs }}
            >
              <Tag
                onRemove={() => setTags(tags.filter((item) => item !== tag))}
                value={tag}
              />
            </View>
          ))}
        </View>
      )}

      <Button
        accessibilityHint="sends an invite"
        mb="sm"
        variant="primary"
        size="full"
        title="Send Invite"
      />
      <Button
        accessibilityHint="goes to main teams screen"
        onPress={() => setFlow('1')}
        variant="secondary"
        size="full"
        title="I'm Done"
      />
    </>
  );
}

const styles = StyleSheet.create({
  otherTeam: {
    flexDirection: 'row',
    marginBottom: Spacings.sm,
    alignItems: 'flex-end',
  },
  tags: {
    marginHorizontal: -4,
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    marginBottom: Spacings.xl,
  },
});
