import {
  ListIcon,
  LocationDotSolidIcon,
  SortSolidIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { NotesQuery } from '../../apollo';

// TODO: Remove this flag when sorting is implemented
const displayInteractionsSorting = false;

interface IInteractionsSortingProps {
  notes: NotesQuery['notes']['results'] | undefined;
  sort: string;
  setSort: (sort: 'list' | 'location' | 'sort') => void;
  totalCount: number;
}

export default function InteractionsSorting(props: IInteractionsSortingProps) {
  const { notes, sort, setSort, totalCount } = props;

  function onSort(sorting: 'list' | 'location' | 'sort') {
    setSort(sorting);
  }

  return (
    <View
      style={{
        marginBottom: Spacings.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextMedium size="md">
        Displaying {notes?.length} of {totalCount} interactions
      </TextMedium>
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
