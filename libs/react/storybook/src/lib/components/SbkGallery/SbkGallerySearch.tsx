import { SearchList } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';

type TSearchItem<T> = {
  searchText: string;
  value: T;
};

type Tprops<T> = {
  data: TSearchItem<T>[];
  placeholder?: string;
  className?: string;
  onChange: (results: T[]) => void;
};

export function SbkGallerySearch<T>(props: Tprops<T>) {
  const { data, onChange, placeholder = 'Search...', className } = props;

  const parentCss = ['w-96', className];

  return (
    <div className={mergeCss(parentCss)}>
      <SearchList<T>
        placeholder={placeholder}
        data={data.map(({ searchText, value }) => {
          return {
            text: searchText,
            value: value,
          };
        })}
        onChange={onChange}
      />
    </div>
  );
}
