import { EllipseIcon } from '@monorepo/react/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Table as StoryComponent } from './Table';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Table',
  parameters: {
    controls: { disable: true },
  },
};

export default meta;

type Story = StoryObj<typeof StoryComponent>;

type TTableItem = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

const firstNames = [
  'Joe',
  'Larry',
  'Anna',
  'Maria',
  'John',
  'Sophie',
  'Mike',
  'Emma',
];
const lastNames = [
  'Smith',
  'Frank',
  'Brown',
  'Johnson',
  'Taylor',
  'Williams',
  'Davis',
];
const roles = ['user', 'admin'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateData(count: number): TTableItem[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);

    return {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}_${i}@example.com`,
      role: getRandomItem(roles),
    };
  });
}

const pagesData: TTableItem[][] = [
  generateData(3),
  generateData(3),
  generateData(2),
];

export const Table: Story = {
  parameters: {
    customLayout: {
      variant: 'basic',
    },
  },
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);

    const TABLE_HEADER = ['First Name', 'Last Name', 'Email', 'Role'];

    return (
      <StoryComponent<TTableItem>
        header={TABLE_HEADER}
        data={pagesData[currentPage - 1]}
        renderCell={(member, colIndex) => {
          switch (colIndex) {
            case 0:
              return member.firstName ?? '';
            case 1:
              return member.lastName ?? '';
            case 2:
              return member.email ?? '';
            case 3:
              return member.role ?? '';
            default:
              return '';
          }
        }}
        action={(member) => (
          <button
            onClick={() => alert(`Clicked: ${member.firstName}`)}
            className="p-2 rounded-lg hover:bg-neutral-100"
          >
            <EllipseIcon className="h-5 w-5 text-neutral-500" />
          </button>
        )}
        page={currentPage}
        totalPages={pagesData.length}
        onPageChange={(newPage) => setCurrentPage(newPage)}
      />
    );
  },
};
