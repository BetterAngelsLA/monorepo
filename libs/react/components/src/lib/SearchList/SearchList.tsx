import { mergeCss } from '../../utils';
import { SearchInput } from '../SearchInput';

type TDataItem<T> = {
  text: string;
  value: T;
};

export type TProps<T> = {
  data: TDataItem<T>[];
  onChange: (results: T[]) => void;
  placeholder?: string;
  className?: string;
  caseSensitive?: boolean;
};

export function SearchList<T>(props: TProps<T>) {
  const { data, onChange, caseSensitive, placeholder, className } = props;

  const parentCss = ['flex', className];

  function onSearchChange(searchText: string) {
    const query = caseSensitive ? searchText : searchText.toLowerCase();

    const results = data
      .filter(({ text }) => {
        const searchableVal = caseSensitive ? text : text.toLowerCase();
        return searchableVal.includes(query);
      })
      .map((r) => r.value);

    onChange(results);
  }

  return (
    <div className={mergeCss(parentCss)}>
      <SearchInput placeholder={placeholder} onChange={onSearchChange} />
    </div>
  );
}
