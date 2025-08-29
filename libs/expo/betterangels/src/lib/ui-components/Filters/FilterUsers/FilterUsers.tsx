import { Filters, TFilterOption } from '@monorepo/expo/shared/ui-components';
import { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ordering } from '../../../apollo';
import { useModalScreen } from '../../../providers';
import { enumDisplaySelahTeam, pagePaddingHorizontal } from '../../../static';
import { useGetUsersQuery } from './__generated__/getUsers.generated';

const paginationLimit = 10;

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
  currentUserId?: string;
  style?: StyleProp<ViewStyle>;
};

export function FilterUsers(props: TProps) {
  const {
    onChange,
    selected,
    currentUserId,
    style,
    title = 'Filter Users',
  } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  const [options, setOptions] = useState<TFilterOption[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [offset, setOffset] = useState<number>(0);

  const { data, loading, error } = useGetUsersQuery({
    variables: {
      filters: { search: filterSearch },
      order: {
        firstName: Ordering.AscNullsFirst,
        lastName: Ordering.AscNullsFirst,
        id: Ordering.Desc,
      },
      pagination: { limit: paginationLimit, offset: offset },
    },
  });

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

  useEffect(() => {
    console.log();
    console.log('| -------------  data  ------------- |');
    console.log(data);
    console.log();
    if (!data?.interactionAuthors) {
      return;
    }

    const { totalCount, results } = data.interactionAuthors;

    console.log();
    console.log('| -------------  results  ------------- |');
    console.log(results);
    console.log();

    const newOptions = results
      .filter(
        // (item) => item.id !== currentUserId && (item.firstName || item.lastName)
        (item) => item.id !== '1'
      )
      .map((item) => ({
        id: item.id,
        label: `${item.id} - ${item.firstName} ${item.lastName || ''}`,
      }));

    console.log(JSON.stringify(newOptions, null, 2));

    if (offset === 0) {
      setOptions(newOptions);
    } else {
      setOptions((prev) => [...prev, ...newOptions]);
    }

    // setHasMore(offset + paginationLimit < totalCount);
  }, [data, offset]);

  return (
    <Filters.Options
      title={title}
      options={options}
      onSelected={onSelect}
      onSearch={(r) => console.log(r)}
      searchDebounceMs={300}
      initalSelected={selected}
      searchPlaceholder="Search authors"
      style={{ paddingHorizontal: pagePaddingHorizontal }}
    />
    // <Filters.Button
    //   id="Authors"
    //   selected={selected.map((s) => s.label)}
    //   onPress={onFilterPress}
    //   style={style}
    //   labelMaxWidth={100}
    // />
  );
}
