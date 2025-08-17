import { SbkGallery, extractFilename } from '@monorepo/react/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentType, SVGProps } from 'react';

type BaseSvgProps = Omit<SVGProps<SVGSVGElement>, 'type'>;
type TSvg = ComponentType<BaseSvgProps>;

type SvgFC = React.FC<React.SVGProps<SVGSVGElement>>;
type SvgModule = { default: SvgFC };

const modules = import.meta.glob<SvgModule>('./**/*.svg', {
  eager: true,
  query: { react: '' }, // to be used by SVGR
});

type TSvgItem = {
  id: string;
  filename: string;
  dirName: string;
  Component: TSvg;
};

const svgs: TSvgItem[] = Object.entries(modules)
  .map(([filePath, mod]) => {
    const { filename, dirs } = extractFilename({
      filePath,
      stripExtension: true,
      dirLevel: 1,
      ignoreDirName: 'svg',
    });

    const itemDir = dirs[0];

    return {
      id: `${itemDir}_${filename}`,
      filename,
      dirName: itemDir,
      Component: mod.default,
    };
  })
  .filter((x) => !!x.Component)
  .sort((a, b) => a.id.localeCompare(b.id));

const meta: Meta = {
  title: 'Iconography',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

export const ReactSvgGallery: Story = {
  parameters: { layout: false },
  render: () => {
    return (
      <SbkGallery
        searchable
        searchPlaceholder="search svg files..."
        data={svgs.map(({ filename, dirName, Component }) => {
          return {
            Item: <Component width={24} height={24} />,
            title: filename,
            subtitle: dirName,
            searchText: `${filename} ${dirName}`,
          };
        })}
      />
    );
  },
};
