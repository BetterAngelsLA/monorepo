import {
  ListIcon,
  LocationDotSolidIcon,
  SolidSortIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextMedium } from '@monorepo/expo/shared/ui-components';
import { Pressable, StyleSheet, View } from 'react-native';
import { NotesQuery } from '../../apollo';

interface IInteractionsSortingProps {
  notes: NotesQuery['notes'] | undefined;
  sort: string;
  setSort: (sort: 'list' | 'location' | 'sort') => void;
}

export default function InteractionsSorting(props: IInteractionsSortingProps) {
  const { notes, sort, setSort } = props;

  function onSort(sorting: 'list' | 'location' | 'sort') {
    setSort(sorting);
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
      <TextMedium size="lg">
        {notes?.length} interaction
        {notes?.length && notes.length > 1 ? 's' : ''}
      </TextMedium>
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
          <SolidSortIcon color={Colors.PRIMARY_EXTRA_DARK} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sortButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
