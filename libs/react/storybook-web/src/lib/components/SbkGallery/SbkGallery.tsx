import { mergeCss } from '@monorepo/react/components';
import { SbkPanel } from '@monorepo/react/storybook-web';
import { ReactNode, useState } from 'react';
import { SbkGalleryCard } from './SbkGalleryCard';
import { SbkGallerySearch } from './SbkGallerySearch';

type TGalleryItem = {
  Item: ReactNode;
  title?: string;
  subtitle?: string;
  searchText?: string;
};

type TGalleryProps = {
  data: TGalleryItem[];
  searchable?: boolean;
  classname?: string;
  listClassname?: string;
  listItemClassname?: string;
  searchPlaceholder?: string;
};

function SbkGallery<T>(props: TGalleryProps) {
  const {
    data,
    searchable,
    classname,
    listClassname,
    listItemClassname,
    searchPlaceholder,
  } = props;

  const [visibleItems, setVisibleItems] = useState<TGalleryItem[]>(data);

  const parentCss = ['flex-col', classname];

  const listCss = [
    'grid',
    'grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]',
    'gap-4',
    listClassname,
  ];

  const listItemCss = ['border', listItemClassname];

  return (
    <SbkPanel className={mergeCss(parentCss)}>
      {searchable && (
        <div className="mb-8 w-96">
          <SbkGallerySearch<TGalleryItem>
            data={data.map((entry) => {
              const searchText =
                entry.searchText || `${entry.title} ${entry.subtitle}`;

              return {
                searchText,
                value: entry,
              };
            })}
            onChange={(results) => setVisibleItems(results)}
            placeholder={searchPlaceholder}
          />

          <div className="flex mt-4 px-2 text-sm items-center">
            <div>Displaying items:</div>
            <div className="ml-2 text-sm">{visibleItems.length}</div>
          </div>
        </div>
      )}

      <div className={mergeCss(listCss)}>
        {visibleItems.map(({ Item, title, subtitle }, idx) => (
          <SbkGalleryCard
            key={`${idx}_${title}`}
            className={mergeCss(listItemCss)}
            Item={Item}
            title={title}
            subtitle={subtitle}
          />
        ))}
      </div>
    </SbkPanel>
  );
}

SbkGallery.Card = SbkGalleryCard;
SbkGallery.Serach = SbkGallerySearch;

export { SbkGallery };
