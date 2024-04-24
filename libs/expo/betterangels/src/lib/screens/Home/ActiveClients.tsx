import { useMutation } from '@apollo/client';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText, ClientCard, H2 } from '@monorepo/expo/shared/ui-components';
import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';
import { CREATE_NOTE } from '../../apollo';
import { useUser } from '../../hooks';

export default function ActiveClients() {
  const [createNote] = useMutation(CREATE_NOTE);
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
      router.navigate(`/add-note/${data?.createNote.id}`);
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
        <H2>Active Clients</H2>
        <Link
          accessible
          accessibilityHint="goes to all active clients list"
          accessibilityRole="button"
          href="#"
        >
          <BodyText color={Colors.PRIMARY}>All Clients</BodyText>
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
