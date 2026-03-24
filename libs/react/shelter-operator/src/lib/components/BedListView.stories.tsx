import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BedStatusChoices } from '../apollo/graphql/__generated__/types';
import type { BedRoomForList } from '../types/bed';
import { BedListView } from './BedListView';

const mockRooms: BedRoomForList[] = [
  {
    id: 'room-1',
    roomLabel: 'Room 1',
    beds: [
      {
        id: 'bed-1',
        bedName: 'North bunk',
        status: BedStatusChoices.Available,
        tags: ['Women Only', 'Shared'],
      },
      {
        id: 'bed-2',
        bedName: 'South bunk',
        status: BedStatusChoices.Occupied,
        tags: ['Shared'],
      },
    ],
  },
  {
    id: 'room-2',
    roomLabel: 'Room 2',
    beds: [
      {
        id: 'bed-3',
        bedName: 'Rollaway 1',
        status: BedStatusChoices.Reserved,
        tags: ['Pets Allowed'],
      },
      {
        id: 'bed-4',
        bedName: 'Twin 2',
        status: BedStatusChoices.OutOfService,
        maintenanceFlag: true,
        tags: [],
      },
    ],
  },
];

const meta: Meta<typeof BedListView> = {
  component: BedListView,
  title: 'BedListView',
  parameters: {
    layout: 'fullscreen',
    customLayout: {
      variant: 'basic',
      className: 'w-full min-h-[80vh] bg-[#f5f6f8] p-4',
    },
  },
};

export default meta;

type Story = StoryObj<typeof BedListView>;

export const Default: Story = {
  render: function BedListViewStory() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <BedListView
        rooms={mockRooms}
        selectedBedIds={selected}
        onSelectedBedIdsChange={setSelected}
        onRowClick={() => undefined}
        onDuplicate={() => undefined}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onDeleteSelected={() => undefined}
        onCreateBed={() => undefined}
      />
    );
  },
};
