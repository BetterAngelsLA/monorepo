import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';

type TProps = {
  label: string;
  onChange: (filters: TFilterOption[]) => void;
  options: TFilterOption[];
  selected: TFilterOption[];
  title?: string;
  searchPlaceholder?: string;
  skipSearch?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FilterStatic(props: TProps) {
  const {
    label,
    options,
    selected,
    onChange,
    searchPlaceholder,
    skipSearch,
    style,
    title,
  } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function onSelect(newSelected: TFilterOption[]) {
    onChange(newSelected);

    closeModalScreen();
  }

  function onFilterPress() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <Filters.Options
          options={options}
          skipSearch={skipSearch}
          onSelected={onSelect}
          initialSelected={selected}
          searchPlaceholder={searchPlaceholder}
        />
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
