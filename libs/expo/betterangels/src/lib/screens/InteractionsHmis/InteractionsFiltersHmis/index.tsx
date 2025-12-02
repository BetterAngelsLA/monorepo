import { Spacings } from '@monorepo/expo/shared/static';

import { ScrollView } from 'react-native';
import AuthorsFilter from './AuthorsFilter';

type TFilters = {
  authors: { id: string; label: string }[];
};

interface IInteractionsFiltersProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

export default function InteractionsFilters(props: IInteractionsFiltersProps) {
  return (
    <ScrollView
      style={{
        marginBottom: Spacings.xs,
        flexGrow: 0,
        flexShrink: 0,
      }}
      contentContainerStyle={{
        gap: Spacings.xs,
      }}
      showsHorizontalScrollIndicator={false}
      horizontal
    >
      <AuthorsFilter {...props} />
    </ScrollView>
  );
}
