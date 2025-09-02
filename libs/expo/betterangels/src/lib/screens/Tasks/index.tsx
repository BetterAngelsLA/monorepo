import { Colors } from '@monorepo/expo/shared/static';
import { StyleSheet } from 'react-native';
import {
  MainContainer,
  TSelectedTaskFilters,
  TaskFilters,
} from '../../ui-components';

export default function Tasks() {
  function onFilterChange(selected: TSelectedTaskFilters) {
    console.log(JSON.stringify(selected, null, 2));
  }

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <TaskFilters onChange={onFilterChange} />
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
  },
});
