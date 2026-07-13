import type { Meta, StoryObj } from '@storybook/react';
import { BedStatusChoices } from '../apollo/graphql/__generated__/types';
import { BedTable, type Bed, type BedRowObject } from './BedTable';

const bed = (
  id: string,
  name: string,
  status: BedStatusChoices,
  roomId: string,
  roomName: string,
  maintenanceFlag = false
): Bed => ({
  id,
  maintenanceFlag,
  name,
  status,
  room: {
    id: roomId,
    name: roomName,
  },
});

const mockBeds: Bed[] = [
  bed('bed-1', 'North bunk', BedStatusChoices.Available, 'room-1', 'Room 1'),
  bed('bed-2', 'South bunk', BedStatusChoices.Occupied, 'room-1', 'Room 1'),
  bed('bed-3', 'Rollaway 1', BedStatusChoices.Reserved, 'room-2', 'Room 2'),
  bed(
    'bed-4',
    'Twin 2',
    BedStatusChoices.OutOfService,
    'room-2',
    'Room 2',
    true
  ),
];

const noopClone = (_rowObject: BedRowObject) => undefined;
const noopEdit = (_rowObject: BedRowObject) => undefined;
const noopDelete = (_bedIds: string[]) => undefined;

const meta: Meta<typeof BedTable> = {
  component: BedTable,
  title: 'BedTable',
  parameters: {
    layout: 'fullscreen',
    customLayout: {
      variant: 'basic',
      className: 'w-full min-h-[80vh] bg-[#f5f6f8] p-4',
    },
  },
};

export default meta;

type Story = StoryObj<typeof BedTable>;

export const Default: Story = {
  render: function BedTableStory() {
    return (
      <BedTable
        beds={mockBeds}
        onClone={noopClone}
        onEdit={noopEdit}
        onDeleteBeds={noopDelete}
      />
    );
  },
};

export const WithAllActions: Story = {
  render: () => (
    <BedTable
      beds={mockBeds.map((b) => ({
        ...b,
        status: b.id === 'bed-4' ? BedStatusChoices.InTurnaround : b.status,
      }))}
      onClone={noopClone}
      onEdit={noopEdit}
      onDeleteBeds={noopDelete}
      onMarkReady={(_rowObject: BedRowObject) => undefined}
      onReserve={(_rowObject: BedRowObject) => undefined}
    />
  ),
};

export const WithoutRowSelection: Story = {
  render: () => (
    <BedTable
      beds={mockBeds}
      onClone={noopClone}
      onEdit={noopEdit}
      onDeleteBeds={noopDelete}
    />
  ),
};
