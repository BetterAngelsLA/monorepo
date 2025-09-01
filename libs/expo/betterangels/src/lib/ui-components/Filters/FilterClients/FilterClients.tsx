import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { FilterClientOptions } from './FilterClientOptions';

type TProps = {
  label: string;
  onChange: (filters: TFilterOption[]) => void;
  selected?: TFilterOption[];
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterClients(props: TProps) {
  const { label, onChange, selected = [], title, style } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function onSelect(newSelected: TFilterOption[]) {
    onChange(newSelected);

    closeModalScreen();
  }

  function onFilterPress() {
    showModalScreen({
      presentation: 'modal',
      content: () => (
        <FilterClientOptions onSelected={onSelect} selected={selected} />
      ),
      title: title,
    });
  }

  return (
    <Filters.Button
      label={label}
      selected={selected.map((s) => s.label)}
      onPress={onFilterPress}
      labelMaxWidth={100}
      style={style}
    />
  );
}
