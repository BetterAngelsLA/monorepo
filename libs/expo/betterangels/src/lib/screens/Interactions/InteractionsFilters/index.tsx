import { Spacings } from '@monorepo/expo/shared/static';

import { View } from 'react-native';
import { SelahTeamEnum } from '../../../apollo';
import CreatedByFilter from './CreatedByFilter';
import TeamsFilter from './TeamsFilter';

type TFilters = {
  teams: { id: SelahTeamEnum; label: string }[];
  createdBy: { id: string; label: string }[];
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
      <TeamsFilter {...props} />
      <CreatedByFilter {...props} />
    </View>
  );
}
