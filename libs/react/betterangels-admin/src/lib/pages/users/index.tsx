import { useAppDrawer } from '@monorepo/react/components';
import { EllipseIcon, PlusIcon } from '@monorepo/react/icons';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { OrganizationMemberType } from '../../apollo/graphql/__generated__/types';
import { AddUserFormDrawer, Table } from '../../components';
import { useUser } from '../../hooks';
import { useOrganizationMembersQuery } from './__generated__/users.generated';

const TABLE_HEADER = [
  'First Name',
  'Last Name',
  'Job Role',
  'Email',
  'Last Login',
];

const PAGE_SIZE = 25;

export default function Users() {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<OrganizationMemberType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { showDrawer } = useAppDrawer();

  const offset = (page - 1) * PAGE_SIZE;
  if (!user?.organizations || user.organizations.length === 0) {
    throw new Error('No organization found for the user');
  }
  const organizationId = user.organizations[0].id;

  function handleShowDrawer() {
    showDrawer({
      content: <AddUserFormDrawer />,
      contentClassName: 'p-0',
    });
  }

  const { data, loading } = useOrganizationMembersQuery({
    variables: {
      organizationId,
      pagination: {
        offset,
        limit: PAGE_SIZE,
      },
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (!data?.organizationMembers?.results) return;

    const { results, totalCount: newTotalCount } = data.organizationMembers;
    setMembers(results);
    setTotalCount(newTotalCount);
  }, [data]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-5 mb-16">
        <div>
          <h1 className="mb-3 text-2xl font-bold">User Management</h1>
          <p className="max-w-[800px]">
            Add new users and view account information for all users in your
            organization.
          </p>
        </div>
        {user.canAddOrgMember && (
          <button
            onClick={handleShowDrawer}
            className="btn btn-primary btn-lg gap-2 inline-flex"
          >
            <PlusIcon color="white" className="w-3 h-3" />
            Add User
          </button>
        )}
      </div>
      {user.canViewOrgMembers ? (
        <Table<(typeof members)[number]>
          header={TABLE_HEADER}
          data={members}
          renderCell={(member, colIndex) => {
            switch (colIndex) {
              case 0:
                return member.firstName ?? '';
              case 1:
                return member.lastName ?? '';
              case 2:
                return member.memberRole ?? '';
              case 3:
                return member.email ?? '';
              case 4:
                return member.lastLogin
                  ? formatDistanceToNow(parseISO(member.lastLogin), {
                      addSuffix: true,
                    })
                  : 'Never';
              default:
                return '';
            }
          }}
          action={(member) => (
            <button
              onClick={() => console.log('Clicked:', member)}
              className="p-2 rounded-lg hover:bg-neutral-100"
            >
              <EllipseIcon className="h-5 w-5 text-neutral-500" />
            </button>
          )}
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      ) : (
        "You don't have permission to view this organization's members."
      )}
    </div>
  );
}
