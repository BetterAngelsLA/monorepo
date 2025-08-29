import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { StyleProp, ViewStyle } from 'react-native';
import { useModalScreen } from '../../../providers';
import { enumDisplaySelahTeam, pagePaddingHorizontal } from '../../../static';

const teamOptions: TFilterOption[] = Object.entries(enumDisplaySelahTeam).map(
  ([key, value]) => ({
    id: key,
    label: value,
  })
);

type TProps = {
  onChange: (filters: TFilterOption[]) => void;
  selected: TFilterOption[];
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const { onChange, selected, style, title = 'Filter Users' } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  function onSelect(newSelected: TFilterOption[]) {
    onChange(newSelected);

    closeModalScreen();
  }

  function onFilterPress(id: string) {
    showModalScreen({
      presentation: 'modal',
      content: (
        <Filters.Options
          title={title}
          options={teamOptions}
          onSelected={onSelect}
          onSearch={(r) => console.log(r)}
          searchDebounceMs={300}
          initalSelected={selected}
          searchPlaceholder="Search authors"
          style={{ paddingHorizontal: pagePaddingHorizontal }}
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
      style={style}
      labelMaxWidth={100}
    />
  );
}
