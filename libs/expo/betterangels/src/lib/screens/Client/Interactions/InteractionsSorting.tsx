import {
  ListIcon,
  LocationDotSolidIcon,
  PlusIcon,
  SortSolidIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { IconButton, TextMedium } from '@monorepo/expo/shared/ui-components';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { NotesQuery } from '../../../apollo';
import { useSnackbar } from '../../../hooks';
import {
  ClientProfileQuery,
  useCreateNoteMutation,
} from '../__generated__/Client.generated';
// TODO: Remove this flag when sorting is implemented
const displayInteractionsSorting = false;

interface IInteractionsSortingProps {
  notes: NotesQuery['notes']['results'] | undefined;
  sort: string;
  setSort: (sort: 'list' | 'location' | 'sort') => void;
  client: ClientProfileQuery | undefined;
  totalCount: number;
}

export default function InteractionsSorting(props: IInteractionsSortingProps) {
  const { notes, sort, setSort, client, totalCount } = props;
  const [createNote] = useCreateNoteMutation();
  const { showSnackbar } = useSnackbar();
  function onSort(sorting: 'list' | 'location' | 'sort') {
    setSort(sorting);
  }

  if (!client) {
    return;
  }

  async function createNoteFunction(id: string) {
    try {
      const { data } = await createNote({
        variables: {
          data: {
            clientProfile: id,
          },
        },
      });
      if (data?.createNote && 'id' in data.createNote) {
        router.navigate(`/add-note/${data.createNote.id}`);
      }
    } catch (err) {
      console.error(err);

      showSnackbar({
        message: `Sorry, there was an error creating a new interaction.`,
        type: 'error',
      });
    }
  }

  return (
    <View
      style={{
        marginBottom: Spacings.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextMedium size="md">
        Displaying {notes?.length} of {totalCount} interactions
      </TextMedium>
      <IconButton
        onPress={() => createNoteFunction(client.clientProfile.id)}
        variant="secondary"
        borderColor={Colors.WHITE}
        accessibilityLabel={'add interaction'}
        accessibilityHint={'add a new interaction'}
      >
        <PlusIcon />
      </IconButton>
      {displayInteractionsSorting && (
        <View style={{ flexDirection: 'row', gap: Spacings.xs }}>
          <Pressable
            onPress={() => onSort('list')}
            style={[
              styles.sortButton,
              {
                backgroundColor: sort === 'list' ? Colors.WHITE : 'transparent',
              },
            ]}
            accessibilityHint="sets sorting to list"
            accessibilityRole="button"
          >
            <ListIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable
            onPress={() => onSort('location')}
            style={[
              styles.sortButton,
              {
                backgroundColor:
                  sort === 'location' ? Colors.WHITE : 'transparent',
              },
            ]}
            accessibilityHint="sets sorting to location"
            accessibilityRole="button"
          >
            <LocationDotSolidIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
          <Pressable
            onPress={() => onSort('sort')}
            style={[
              styles.sortButton,
              {
                backgroundColor: sort === 'sort' ? Colors.WHITE : 'transparent',
              },
            ]}
            accessibilityHint="sets sorting to list"
            accessibilityRole="button"
          >
            <SortSolidIcon color={Colors.PRIMARY_EXTRA_DARK} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sortButton: {
    height: Spacings.xl,
    width: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radiuses.xs,
  },
});
