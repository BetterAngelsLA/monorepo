import { SbkGallery, extractFilename } from '@monorepo/react/storybook-web';
import type { Meta, StoryObj } from '@storybook/react';
import { FC, SVGProps } from 'react';

type SvgFC = FC<SVGProps<SVGSVGElement>>;
type SvgModule = { default: SvgFC };

const modules = import.meta.glob<SvgModule>(
  '../../../../expo/shared/icons/src/assets/**/*.svg',
  {
    eager: true,
    query: { react: '' }, // to be used by SVGR only (until convert all to SVGR)
  }
);

type TSvgItem = {
  id: string;
  fileName: string;
  dirName: string;
  Component: SvgFC;
};

const svgs: TSvgItem[] = Object.entries(modules)
  .map(([filePath, mod]) => {
    const { filename, dirs } = extractFilename({
      filePath,
      dirLevel: 1,
      ignoreDirName: 'svg',
      stripExtension: true,
    });

    const itemDir = dirs[0];

    return {
      id: `${itemDir}_${filename}`,
      fileName: filename,
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

export const ExpoSvgGallery: Story = {
  parameters: { layout: false },
  render: () => {
    return (
      <SbkGallery
        searchable
        searchPlaceholder="search svg files..."
        data={svgs.map(({ fileName, dirName, Component }) => {
          return {
            Item: <Component width={24} height={24} />,
            title: fileName,
            subtitle: dirName,
            searchText: `${fileName} ${dirName}`,
          };
        })}
      />
    );
  },
};
