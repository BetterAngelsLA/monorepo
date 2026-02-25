import { useMutation, useQuery } from '@apollo/client/react';
import { Table, useAlert, useAppDrawer } from '@monorepo/react/components';
import { PlusIcon, ThreeDotIcon } from '@monorepo/react/icons';
import { mergeCss, toError } from '@monorepo/react/shared';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { JSX, useRef, useState } from 'react';
import {
  Ordering,
  OrganizationMemberOrdering,
  OrganizationMemberType,
} from '../../apollo/graphql/__generated__/types';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import { AddUserFormDrawer } from '../../components';
import { useOutsideClick } from '../../hooks';
import { useUser } from '../../providers';
import {
  OrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
} from './__generated__/users.generated';

const PAGE_SIZE = 25;
type IProps = {
  className?: string;
};
const COLUMNS: {
  label: string;
  field: keyof OrganizationMemberOrdering;
  render: (m: OrganizationMemberType) => string | JSX.Element;
}[] = [
  { label: 'First Name', field: 'firstName', render: (m) => m.firstName ?? '' },
  { label: 'Last Name', field: 'lastName', render: (m) => m.lastName ?? '' },
  { label: 'Job Role', field: 'memberRole', render: (m) => m.memberRole },
  { label: 'Email', field: 'email', render: (m) => m.email ?? '' },
  {
    label: 'Last Login',
    field: 'lastLogin',
    render: (m) =>
      m.lastLogin
        ? formatDistanceToNow(parseISO(m.lastLogin), { addSuffix: true })
        : 'Never',
  },
];

function useOrganizationMembers(
  orgId: string,
  page: number,
  sort: { field: string; direction: Ordering }
) {
  const { data, loading, previousData } = useQuery(
    OrganizationMembersDocument,
    {
      variables: {
        organizationId: orgId,
        pagination: { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        ordering: [{ [sort.field]: sort.direction }],
      },
      skip: !orgId,
      fetchPolicy: 'cache-and-network',
    }
  );

  const activeData = data ?? previousData;
  const totalCount = activeData?.organizationMembers?.totalCount ?? 0;

  return {
    loading,
    members: activeData?.organizationMembers?.results ?? [],
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    isInitialLoad: loading && !activeData,
  };
}

export default function Users(props: IProps) {
  const { className = '' } = props;
  const { user } = useUser();
  const { showDrawer } = useAppDrawer();
  const { showAlert } = useAlert();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    field: keyof OrganizationMemberOrdering;
    direction: Ordering;
  }>({ field: 'lastName', direction: Ordering.Asc });
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    menuRef,
    () => setOpenMenuRowId(null),
    openMenuRowId !== null
  );

  const organizationId = user?.organizations?.[0]?.id ?? '';
  const [removeOrganizationMember, { loading: isRemovingOrganizationMember }] =
    useMutation(RemoveOrganizationMemberDocument);

  const { members, totalPages, loading, isInitialLoad } =
    useOrganizationMembers(organizationId, page, sort);

  const parentCss = [
    'flex',
    'flex-1',
    'h-screen',
    `${loading ? 'opacity-50 transition-opacity duration-200' : ''}`,
    className,
  ];

  const handleRemoveMember = async (member: OrganizationMemberType) => {
    if (!organizationId) {
      return;
    }

    try {
      const response = await removeOrganizationMember({
        variables: {
          data: {
            id: member.id,
            organizationId,
          },
        },
        refetchQueries: [OrganizationMembersDocument],
        awaitRefetchQueries: true,
      });

      const errorMessage = extractOperationInfoMessage(
        response,
        'removeOrganizationMember'
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      const deletedMember = response.data?.removeOrganizationMember;

      if (deletedMember?.__typename !== 'DeletedObjectType') {
        throw new Error('Sorry, something went wrong.');
      }

      showAlert({
        type: 'success',
        content: `${member.firstName ?? 'User'} ${
          member.lastName ?? ''
        } successfully removed.`,
      });
    } catch (err) {
      const error = toError(err);
      console.error(`error removing user: ${error.message}`);
      showAlert({
        type: 'error',
        content: error.message,
      });
    } finally {
      setOpenMenuRowId(null);
    }
  };

  if (!organizationId) return null;
  if (isInitialLoad)
    return <div className="flex justify-center py-20">Loading...</div>;

  const handleSort = (field: keyof OrganizationMemberOrdering) => {
    setPage(1);
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === Ordering.Asc
          ? Ordering.Desc
          : Ordering.Asc,
    }));
  };

  const headerButtons = COLUMNS.map((col) => (
    <button
      key={col.label}
      onClick={() => handleSort(col.field)}
      className="flex items-center gap-1 hover:text-primary-60"
    >
      {col.label}
      {sort.field === col.field && (
        <span className="text-xs text-primary-20">
          {sort.direction === Ordering.Asc ? '▲' : '▼'}
        </span>
      )}
    </button>
  ));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-5 mb-16">
        <div>
          <h1 className="mb-3 text-2xl font-bold">User Management</h1>
          <p className="max-w-[800px]">Manage users in your organization.</p>
        </div>
        {user?.canAddOrgMember && (
          <button
            onClick={() =>
              showDrawer({
                content: <AddUserFormDrawer />,
                contentClassName: 'p-0',
              })
            }
            className="btn btn-primary btn-lg gap-2 inline-flex px-4"
          >
            <PlusIcon color="white" className="w-3 h-3" /> Add User
          </button>
        )}
      </div>

      <div className={mergeCss(parentCss)}>
        {user?.canViewOrgMembers ? (
          <Table<OrganizationMemberType>
            action={(row) => {
              const isOpen = openMenuRowId === row.id;
              return (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuRowId((prev) =>
                        prev === row.id ? null : row.id
                      );
                    }}
                    className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-neutral-99 relative z-0"
                  >
                    <ThreeDotIcon className="w-6" fill="#052b73" />
                  </button>
                  {isOpen && (
                    <div
                      ref={menuRef}
                      className="absolute flex flex-col items-start top-full right-1/2 shadow-md bg-white z-10 p-2 rounded-lg"
                    >
                      <button
                        className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left text-alert-60"
                        onClick={() => void handleRemoveMember(row)}
                        disabled={isRemovingOrganizationMember}
                      >
                        Remove User
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
            data={members}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            header={headerButtons}
            renderCell={(member, index) => COLUMNS[index].render(member)}
          />
        ) : (
          "You don't have permission to view this organization's members."
        )}
      </div>
    </div>
  );
}
