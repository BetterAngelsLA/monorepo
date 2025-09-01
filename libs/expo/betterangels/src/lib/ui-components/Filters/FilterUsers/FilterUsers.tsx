import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterUserOptions } from './FilterUserOptions';

type TProps = {
  onChange: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  currentUserId?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const { currentUserId, onChange, selected = [], title, style } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function onSelect(newSelected: TFilterOption[]) {
    onChange(newSelected);

    closeModalScreen();
  }

  function onFilterPress(id: string) {
    showModalScreen({
      presentation: 'modal',
      content: () => (
        <FilterUserOptions
          onSelected={onSelect}
          selected={selected}
          currentUserId={currentUserId}
        />
      ),
      title: title,
    });
  }

  return (
    <Filters.Button
      id="Authors"
      selected={selected.map((s) => s.label)}
      onPress={onFilterPress}
      labelMaxWidth={100}
      style={style}
    />
  );
}
