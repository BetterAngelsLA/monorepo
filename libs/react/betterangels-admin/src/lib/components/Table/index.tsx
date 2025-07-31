import { EllipseIcon } from '@monorepo/react/icons';
import { ReactElement } from 'react';

type User = {
  firstName: string;
  lastName: string;
  jobRole: string;
  email: string;
  lastLogin: string;
};

type TableProps = {
  data: User[];
};

export default function UserTable({ data }: TableProps): ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-blue-100 text-sm font-medium text-neutral-700">
            <th className="px-4 py-3">First Name</th>
            <th className="px-4 py-3">Last Name</th>
            <th className="px-4 py-3">Job Role</th>
            <th className="px-4 py-3">Email Address</th>
            <th className="px-4 py-3">Last Login</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, idx) => (
            <tr
              key={`${user.email}-${idx}`}
              className="border-b border-neutral-200 hover:bg-neutral-50"
            >
              <td className="px-4 py-3">{user.firstName}</td>
              <td className="px-4 py-3">{user.lastName}</td>
              <td className="px-4 py-3">{user.jobRole}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.lastLogin}</td>
              <td className="px-4 py-3 text-right">
                <button className="p-2 rounded-lg hover:bg-neutral-100">
                  <EllipseIcon className="h-5 w-5 text-neutral-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
