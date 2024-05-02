import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  ClientCard,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import {
  useClientsQuery,
  useCreateNoteMutation,
} from './__generated__/ActiveClients.generated';

export default function ActiveClients() {
  const [createNote] = useCreateNoteMutation();
  const { data, loading, error } = useClientsQuery({
    variables: { filters: { isActive: false } },
  });
  const router = useRouter();

  async function createNoteFunction(
    id: string,
    firstName: string | undefined | null
  ) {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            title: `Session with ${firstName || 'Client'}`,
            client: id,
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
  if (!data) return null;

  console.log(data?.clients);
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
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <TextRegular>Something went wrong!</TextRegular>
      ) : (
        data?.clients.map((client) => (
          <ClientCard
            key={client.id}
            onPress={() => createNoteFunction(client.id, client.firstName)}
            mb="sm"
            firstName={client.firstName}
            lastName={client.lastName}
          />
        ))
      )}
    </>
  );
}
