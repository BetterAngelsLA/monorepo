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

export function FilterTeams(props: TProps) {
  const { onChange, selected, style, title = 'Filter Teams' } = props;

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
          initalSelected={selected}
          searchPlaceholder="Search teams"
          style={{ paddingHorizontal: pagePaddingHorizontal }}
        />
      ),
      title: title,
    });
  }

  return (
    <Filters.Button
      id="Teams"
      selected={selected.map((s) => s.label)}
      onPress={onFilterPress}
      style={style}
      labelMaxWidth={100}
    />
  );
}
