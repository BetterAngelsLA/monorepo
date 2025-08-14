import type { Meta, StoryObj } from '@storybook/react';
import { ComponentType, SVGProps } from 'react';
import * as icons from '../index';

// Avoid prop collision with SVG's built-in `type` attribute
type BaseSvgProps = Omit<SVGProps<SVGSVGElement>, 'type'>;
type TIconFile = ComponentType<BaseSvgProps>;

const meta: Meta = {
  title: 'Iconography',
  parameters: { controls: { disable: true } },
};
export default meta;

type Story = StoryObj;

export const IconGallery: Story = {
  render: () => {
    const entries = Object.entries(icons) as [string, TIconFile][];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {entries.map(([name, IconCmp]) => (
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
            <IconCmp width={24} height={24} role="img" aria-label={name} />
            <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}>
              {name}
            </div>
          </div>
        ))}
      </div>
    );
  },
};
