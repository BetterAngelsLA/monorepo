import { SearchList } from '@monorepo/react/components';
import { SbkPanel } from '@monorepo/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentType, SVGProps, useState } from 'react';
import * as icons from '../index';

// Avoid prop collision with SVG's built-in `type` attribute
type BaseSvgProps = Omit<SVGProps<SVGSVGElement>, 'type'>;
type TIconFile = ComponentType<BaseSvgProps>;

const iconEntries = Object.entries(icons) as [string, TIconFile][];

type TIconItem = {
  name: string;
  icon: TIconFile;
};

const iconList: TIconItem[] = Object.entries(icons).map(([key, value]) => {
  return {
    name: key,
    icon: value,
  };
});

const meta: Meta = {
  title: 'Iconography',
  parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj;

export const IconGallery: Story = {
  parameters: { layout: false },
  render: () => {
    const [visibleIcons, setVisibleIcons] = useState<TIconItem[]>(iconList);

    return (
      <SbkPanel className="flex-col">
        <div className="mb-8 w-96">
          <SearchList<TIconItem>
            placeholder="Search icons xx"
            data={iconList.map((entry) => {
              return {
                text: entry.name,
                value: entry,
              };
            })}
            onChange={(results) => setVisibleIcons(results)}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {visibleIcons.map(({ name, icon: IconComponent }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 8,
              }}
            >
              <IconComponent
                width={24}
                height={24}
                role="img"
                aria-label={name}
              />
              <div style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
                {name}
              </div>
            </div>
          ))}
        </div>
      </SbkPanel>
    );
  },
};
