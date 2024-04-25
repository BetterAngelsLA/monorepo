import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ClientCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useUser } from '../../hooks';
import { useCreateNoteMutation } from './__generated__/ActiveClients.generated';

export default function ActiveClients() {
  const [createNote] = useCreateNoteMutation();
  const { user } = useUser();
  const router = useRouter();

  async function createNoteFunction() {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            // TODO: This should be client name once we're fetching and mapping clients
            title: `Session with ${user?.firstName}`,
            client: user?.id,
          },
        },
      });
      if (data?.createNote && 'id' in data.createNote) {
        router.navigate(`/add-note/${data?.createNote.id}`);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacings.sm,
        }}
      >
        <TextMedium size="lg">Active Clients</TextMedium>
        <Link
          accessible
          accessibilityHint="goes to all active clients list"
          accessibilityRole="button"
          href="#"
        >
          <TextRegular color={Colors.PRIMARY}>All Clients</TextRegular>
        </Link>
      </View>
      <ClientCard
        onPress={createNoteFunction}
        mb="sm"
        imageUrl=""
        address="361 S Spring St."
        firstName="first name"
        lastName="last name"
        progress="10%"
      />
    </>
  );
}
