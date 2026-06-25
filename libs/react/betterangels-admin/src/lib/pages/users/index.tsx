import { useMutation, useQuery } from '@apollo/client/react';
import {
  SearchInput,
  Table,
  useAlert,
  useAppDrawer,
} from '@monorepo/react/components';
import { PlusIcon, ThreeDotIcon, UserIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { JSX, useMemo, useRef, useState } from 'react';
import {
  Ordering,
  OrgRoleEnum,
  OrganizationMemberOrdering,
  OrganizationMemberType,
  PermissionTemplateEnum,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import { AddUserFormDrawer } from '../../components';
import { useOutsideClick } from '../../hooks';
import { useActiveOrg } from '../../providers';
import {
  OrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
} from './__generated__/users.generated';

const PAGE_SIZE = 25;
type IProps = {
  className?: string;
};

const ROLE_LABELS: Partial<Record<PermissionTemplateEnum | OrgRoleEnum, string>> = {
  [PermissionTemplateEnum.Caseworker]: 'Caseworker',
  [OrgRoleEnum.Admin]: 'Admin',
  [OrgRoleEnum.Member]: 'Member',
  [OrgRoleEnum.Superuser]: 'Superuser',
};

function roleLabel(m: OrganizationMemberType): string {
  if (m.memberRole === OrgRoleEnum.Admin || m.memberRole === OrgRoleEnum.Superuser) {
    return ROLE_LABELS[m.memberRole] ?? m.memberRole;
  }
  const templates = (m.permissionTemplates ?? [])
    .map((t) => ROLE_LABELS[t])
    .filter(Boolean)
    .join(', ');
  return templates || (ROLE_LABELS[m.memberRole] ?? m.memberRole);
}

const getFullName = (m: OrganizationMemberType): string =>
  `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || 'Unknown';

const formatRelativeDate = (iso: string | null | undefined): string | null =>
  iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : null;

const COLUMNS: {
  label: string;
  field: keyof OrganizationMemberOrdering;
  render: (m: OrganizationMemberType) => string | JSX.Element;
}[] = [
  {
    label: '',
    field: 'firstName',
    render: (m) =>
      m.isOrgOwner ? (
        <span title="Organization Owner" className="text-amber-500">
          <StarIconSm className="w-4 h-4" />
        </span>
      ) : (
        ''
      ),
  },
  {
    label: 'Name',
    field: 'firstName',
    render: getFullName,
  },
  {
    label: 'Job Role',
    field: 'memberRole',
    render: (m) => roleLabel(m),
  },
  { label: 'Email', field: 'email', render: (m) => m.email ?? '' },
  {
    label: 'Created',
    field: 'dateJoined',
    render: (m) => formatRelativeDate(m.dateJoined) ?? 'Unknown',
  },
  {
    label: 'Last Login',
    field: 'lastLogin',
    render: (m) => formatRelativeDate(m.lastLogin) ?? 'Never',
  },
];

function useOrganizationMembers(
  orgId: string,
  page: number,
  sort: { field: string; direction: Ordering },
  search?: string
) {
  const { data, loading, previousData, refetch } = useQuery(
    OrganizationMembersDocument,
    {
      variables: {
        organizationId: orgId,
        pagination: { offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        ordering: [{ [sort.field]: sort.direction }],
        filters: { search },
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
    refetch,
  };
}

export default function Users(props: IProps) {
  const { className = '' } = props;
  const { activeOrg, hasPermission } = useActiveOrg();
  const { showDrawer } = useAppDrawer();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
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

  const organizationId = activeOrg?.id ?? '';
  const [removeOrganizationMember, { loading: isRemovingOrganizationMember }] =
    useMutation(RemoveOrganizationMemberDocument);

  const { members, totalPages, loading, isInitialLoad, refetch } =
    useOrganizationMembers(organizationId, page, sort, search);

  const parentCss = [
    'flex-1',
    'min-h-0',
    'overflow-x-auto',
    `${loading ? 'opacity-50 transition-opacity duration-200' : ''}`,
    className,
  ];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
        content: `${getFullName(member)} successfully removed.`,
      });
    } catch (err) {
      console.error(err);
      showAlert({
        type: 'error',
        content: 'Sorry, something went wrong. Please try again.',
      });
    } finally {
      setOpenMenuRowId(null);
    }
  };

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

  const headerButtons = useMemo(
    () =>
      COLUMNS.map((col) =>
        col.label ? (
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
        ) : (
          <span key="owner-col" />
        )
      ),
    [sort]
  );

  if (!organizationId) return null;
  if (isInitialLoad)
    return <div className="flex justify-center py-20">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 md:mb-10">
        <h1 className="mb-2 md:mb-3 text-xl md:text-2xl font-bold">
          User Management
        </h1>
        <p className="max-w-[800px] text-sm md:text-base text-gray-500">
          Manage users in your organization.
        </p>
      </div>
      <div className="flex items-center justify-between gap-5 mb-6">
        <div className="flex-1 max-w-xs">
          <SearchInput debounceMs={300} onChange={handleSearchChange} />
        </div>
        {hasPermission(UserOrganizationPermissions.AddOrgMember) && (
          <button
            onClick={() =>
              showDrawer({
                content: <AddUserFormDrawer onSuccess={refetch} />,
                contentClassName: 'p-0',
              })
            }
            className="btn btn-primary btn-lg gap-2 inline-flex items-center px-4 shrink-0"
          >
            <PlusIcon color="white" className="w-3 h-3" /> Add User
          </button>
        )}
      </div>

      {hasPermission(UserOrganizationPermissions.ViewOrgMembers) ? (
        <>
          {/* ── Mobile & Tablet: card layout (shown < lg, i.e. < 1024px) ── */}
          <div className="lg:hidden space-y-2 overflow-y-auto flex-1 min-h-0">
            {loading && !members.length ? (
              <StatusMessage text="Loading..." />
            ) : members.length === 0 ? (
              <StatusMessage
                text={
                  search
                    ? 'No users match your search.'
                    : 'No users in this organization.'
                }
              />
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-95 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-primary-40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {member.firstName ?? ''} {member.lastName ?? ''}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {roleLabel(member)}
                      </div>
                    </div>
                    {member.isOrgOwner && (
                      <span
                        title="Organization Owner"
                        className="text-amber-500 shrink-0"
                      >
                        <StarIconSm className="w-4 h-4" />
                      </span>
                    )}
                    {/* Three-dot action menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuRowId((prev) =>
                            prev === member.id ? null : member.id
                          );
                        }}
                        className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-neutral-99"
                      >
                        <ThreeDotIcon className="w-5" fill="#052b73" />
                      </button>
                      {openMenuRowId === member.id && (
                        <div
                          ref={menuRef}
                          className="absolute flex flex-col items-start top-full right-0 shadow-md bg-white z-10 p-2 rounded-lg min-w-[140px]"
                        >
                          <button
                            className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left text-alert-60 text-sm"
                            onClick={() => void handleRemoveMember(member)}
                            disabled={isRemovingOrganizationMember}
                          >
                            Remove User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-50 text-xs">
                    <div className="truncate mb-1.5">
                      <span className="text-gray-400">Email: </span>
                      <span className="text-gray-900">
                        {member.email ?? '—'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3">
                      <div className="min-w-0 truncate">
                        <span className="text-gray-400">Created: </span>
                        <span className="text-gray-900">
                          {formatRelativeDate(member.dateJoined) ?? '—'}
                        </span>
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-gray-400">Last Login: </span>
                        <span className="text-gray-900">
                          {formatRelativeDate(member.lastLogin) ?? 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop: table layout (shown ≥ lg, i.e. ≥ 1024px) ── */}
          <div className={mergeCss(['hidden lg:flex', parentCss])}>
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
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-sm py-8 text-center">
          You don't have permission to view this organization's members.
        </div>
      )}
    </div>
  );
}

/** Star icon for org owner indicator. */
function StarIconSm({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StatusMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center py-8 text-sm text-gray-500">{text}</div>
  );
}
