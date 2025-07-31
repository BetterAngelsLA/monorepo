import { Table } from '../../components';

const users = [
  {
    firstName: 'Samantha',
    lastName: 'Kent',
    jobRole: 'Org Owner',
    email: 'jessicajohnson@selah.org',
    lastLogin: '2 days ago',
  },
  {
    firstName: 'Alice',
    lastName: 'Todds',
    jobRole: 'Admin',
    email: 'alicetodds@selah.org',
    lastLogin: '4 days ago',
  },
  {
    firstName: 'Emily',
    lastName: 'Smith',
    jobRole: 'User',
    email: 'emilysmith@selah.org',
    lastLogin: 'Never',
  },
  {
    firstName: 'Sarah',
    lastName: 'Davis',
    jobRole: 'User',
    email: 'sarahdavis@selah.org',
    lastLogin: '1 days ago',
  },
  {
    firstName: 'Mia',
    lastName: 'Taylor',
    jobRole: 'User',
    email: 'miataylor@selah.org',
    lastLogin: '1 hour ago',
  },
  {
    firstName: 'Olivia',
    lastName: 'Wilson',
    jobRole: 'User',
    email: 'oliviawilson@selah.org',
    lastLogin: '35 min ago',
  },
];

export default function Users() {
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">User Management</h1>
      <p className="mb-16">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor
        sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua.
      </p>
      <Table data={users} />
    </div>
  );
}
