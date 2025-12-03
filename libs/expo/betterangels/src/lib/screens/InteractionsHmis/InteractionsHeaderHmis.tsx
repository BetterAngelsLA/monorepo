import { SearchIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BasicInput, TextButton } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

interface IInteractionsHeaderProps {
  search: string;
  setSearch: (search: string) => void;
  onFiltersReset: () => void;
}

export default function InteractionsHeader(props: IInteractionsHeaderProps) {
  const { search, setSearch, onFiltersReset } = props;

  function onDelete() {
    setSearch('');
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacings.sm,
        gap: Spacings.xs,
      }}
    >
      <View style={{ flex: 1 }}>
        <BasicInput
          placeholder="Search interactions"
          onDelete={onDelete}
          icon={<SearchIcon ml="sm" color={Colors.NEUTRAL} />}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <TextButton
        onPress={onFiltersReset}
        regular
        title="Reset"
        accessibilityHint="Reset filters"
      />
    </View>
  );
}
