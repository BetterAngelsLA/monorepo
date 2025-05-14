import { Spacings } from '@monorepo/expo/shared/static';

import { ScrollView, View } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import AuthorsFilter from './AuthorsFilter';
import TeamsFilter from './TeamsFilter';

type TFilters = {
  teams: { id: SelahTeamEnum; label: string }[];
  authors: { id: string; label: string }[];
};

interface IInteractionsFiltersProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

export default function InteractionsFilters(props: IInteractionsFiltersProps) {
  return (
    <View
      style={{
        marginBottom: Spacings.xl,
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: Spacings.xs,
      }}
    >
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal
      >
        <TeamsFilter {...props} />
        <AuthorsFilter {...props} />
      </ScrollView>
    </View>
  );
}
