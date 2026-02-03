import { Spacings } from '@monorepo/expo/shared/static';

import { ScrollView } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import AuthorsFilter from './AuthorsFilter';
import OrganizationFilter from './OrganizationFilter';
import TeamsFilter from './TeamsFilter';

type TFilters = {
  authors: { id: string; label: string }[];
  organizations: { id: string; label: string }[];
  teams: { id: SelahTeamEnum; label: string }[];
};

interface IInteractionsFiltersProps {
  setFilters: (filters: TFilters) => void;
  filters: TFilters;
}

export default function InteractionsFilters(props: IInteractionsFiltersProps) {
  return (
    <ScrollView
      style={{
        marginBottom: Spacings.xl,
        flexGrow: 0,
        flexShrink: 0,
      }}
      contentContainerStyle={{
        gap: Spacings.xs,
      }}
      showsHorizontalScrollIndicator={false}
      horizontal
    >
      <TeamsFilter {...props} />
      <AuthorsFilter {...props} />
      <OrganizationFilter {...props} />
    </ScrollView>
  );
}
