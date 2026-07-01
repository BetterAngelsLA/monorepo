import { useMutation, useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { UserIcon } from '@monorepo/react/icons';
import { useDebounce } from '@monorepo/react/shared';
import { useUser } from '@monorepo/react/shelter';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  Ordering,
  OrgRoleEnum,
  OrganizationMemberOrdering,
  OrganizationMemberType,
  PermissionTemplateEnum,
} from '@monorepo/ba-platform/types';
import { UserOrganizationPermissions } from '@monorepo/ba-platform/permissions';
import { AddUserFormModal } from '../../components/AddUserForm';
import { Button } from '../../components/base-ui/buttons/buttons';
import { ConfirmationModal } from '../../components/base-ui/modal/ConfirmationModal';
import {
  Table,
  type SortDirection,
  type TableColumn,
} from '../../components/base-ui/table';
import { useToast } from '../../components/base-ui/toast';
import {
  OrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
} from './__generated__/users.generated';

const PAGE_SIZE = 25;

const ROLE_LABELS: Partial<
  Record<PermissionTemplateEnum | OrgRoleEnum, string>
> = {
  [PermissionTemplateEnum.ShelterOperator]: 'Shelter Operator',
  [OrgRoleEnum.Admin]: 'Admin',
  [OrgRoleEnum.Member]: 'Member',
  [OrgRoleEnum.Superuser]: 'Superuser',
};

function roleLabel(m: OrganizationMemberType): string {
  if (
    m.memberRole === OrgRoleEnum.Admin ||
    m.memberRole === OrgRoleEnum.Superuser
  ) {
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

const COLUMNS: TableColumn<OrganizationMemberType>[] = [
  {
    key: 'isOrgOwner',
    label: '',
    width: '36px',
    headerClassName: 'justify-self-center',
    cellClassName: 'justify-self-center',
    render: (m) =>
      m.isOrgOwner ? (
        <span title="Organization Owner" className="text-amber-500">
          <StarIcon className="w-4 h-4" />
        </span>
      ) : null,
  },
  {
    key: 'firstName',
    label: 'Name',
    width: '1.4fr',
    cellClassName: 'font-medium text-gray-900 truncate',
    render: getFullName,
    sortValue: (m) => getFullName(m),
  },
  {
    key: 'role',
    label: 'Role',
    width: '1fr',
    cellClassName: 'truncate text-gray-700',
    render: (m) => roleLabel(m),
    sortValue: (m) => roleLabel(m),
    filterValue: (m) => roleLabel(m),
  },
  {
    key: 'email',
    label: 'Email',
    width: '1.3fr',
    cellClassName: 'truncate text-gray-700',
    render: (m) => m.email ?? '',
    sortValue: (m) => m.email ?? '',
  },
  {
    key: 'dateJoined',
    label: 'Created',
    width: '0.9fr',
    cellClassName: 'truncate text-gray-700',
    render: (m) => formatRelativeDate(m.dateJoined) ?? 'Unknown',
    sortValue: (m) => m.dateJoined ?? '',
  },
  {
    key: 'lastLogin',
    label: 'Last Login',
    width: '0.9fr',
    cellClassName: 'truncate text-gray-700',
    render: (m) => formatRelativeDate(m.lastLogin) ?? 'Never',
    sortValue: (m) => m.lastLogin ?? '',
  },
];

function useOrganizationMembers(
  orgId: string,
  page: number,
  sort: { field: keyof OrganizationMemberOrdering; direction: Ordering },
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
    members: (activeData?.organizationMembers?.results ??
      []) as OrganizationMemberType[],
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    isInitialLoad: loading && !activeData,
    refetch,
  };
}

interface RemoveConfirmation {
  isOpen: boolean;
  member: OrganizationMemberType | null;
}

export function UsersPage() {
  const { activeOrg, hasPermission } = useActiveOrg();
  const { user: currentUser } = useUser();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    field: keyof OrganizationMemberOrdering;
    direction: Ordering;
  }>({ field: 'lastName', direction: Ordering.Asc });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [removeConfirmation, setRemoveConfirmation] =
    useState<RemoveConfirmation>({ isOpen: false, member: null });

  const organizationId = activeOrg?.id ?? '';

  const [removeOrganizationMember, { loading: isRemoving }] = useMutation(
    RemoveOrganizationMemberDocument
  );

  const { members, totalPages, loading, isInitialLoad, refetch } =
    useOrganizationMembers(organizationId, page, sort, search);

  const canView = hasPermission(UserOrganizationPermissions.ViewOrgMembers);
  const canAdd = hasPermission(UserOrganizationPermissions.AddOrgMember);

  const debouncedSearch = useDebounce(search, 300);

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSortChange = useCallback(
    (column: string | null, direction: SortDirection | null) => {
      setPage(1);
      if (!column || !direction) {
        setSort({ field: 'lastName', direction: Ordering.Asc });
        return;
      }
      const field = column as keyof OrganizationMemberOrdering;
      setSort({
        field,
        direction: direction === 'asc' ? Ordering.Asc : Ordering.Desc,
      });
    },
    []
  );

  const handleRemoveMember = useCallback(
    async (member: OrganizationMemberType) => {
      if (!organizationId) return;

      try {
        await removeOrganizationMember({
          variables: {
            data: {
              id: member.id,
              organizationId,
            },
          },
          refetchQueries: [OrganizationMembersDocument],
          awaitRefetchQueries: true,
        });
        showToast({
          status: 'success',
          title: `${getFullName(member)} removed.`,
        });
      } catch (err) {
        showToast({
          status: 'error',
          title: err instanceof Error ? err.message : 'Failed to remove user.',
        });
      } finally {
        setRemoveConfirmation({ isOpen: false, member: null });
      }
    },
    [organizationId, removeOrganizationMember, showToast]
  );

  const handleAddSuccess = useCallback(() => {
    setIsAddModalOpen(false);
    refetch();
    showToast({
      status: 'success',
      title: 'User added successfully.',
    });
  }, [refetch, showToast]);

  const emptyMessage = search
    ? 'No users match your search.'
    : 'No users in this organization.';

  const renderAction = useCallback(
    (member: OrganizationMemberType) => {
      if (currentUser?.id === member.id) {
        return <span className="text-xs text-[#747A82]">You</span>;
      }
      return (
        <Button
          variant="trash"
          onClick={() => setRemoveConfirmation({ isOpen: true, member })}
        />
      );
    },
    [currentUser]
  );

  if (!organizationId) return null;

  if (isInitialLoad) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-[#747A82]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-10">
        <h1 className="mb-3 text-2xl font-bold text-[#383B40]">
          User Management
        </h1>
        <p className="text-[#747A82]">Manage users in your organization.</p>
      </div>

      <div className="flex items-center justify-between gap-5 mb-6">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-full border border-gray-200 bg-white px-5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors duration-200 focus-within:border-[#008CEE]"
          />
        </div>

        {canAdd && (
          <Button
            variant="primary"
            color="blue"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add User
          </Button>
        )}
      </div>

      {canView ? (
        <>
          {/* Mobile & Tablet: cards */}
          <div className="lg:hidden space-y-2">
            {loading && !members.length ? (
              <StatusMessage text="Loading..." />
            ) : members.length === 0 ? (
              <StatusMessage text={emptyMessage} />
            ) : (
              members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  renderAction={renderAction}
                />
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block w-full">
            <Table<OrganizationMemberType>
              columns={COLUMNS}
              rows={members}
              getRowKey={(m) => m.id}
              trailingColumnWidth="60px"
              trailingHeader={<div />}
              getRowSlot={renderAction}
              loading={loading}
              loadingState={<StatusMessage text="Loading..." />}
              emptyState={<StatusMessage text={emptyMessage} />}
              sortColumn={sort.field}
              sortDirection={sort.direction === Ordering.Asc ? 'asc' : 'desc'}
              onSortChange={handleSortChange}
            />
          </div>
        </>
      ) : (
        <p className="text-[#747A82]">
          You don't have permission to view this organization's members.
        </p>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <AddUserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <ConfirmationModal
        isOpen={removeConfirmation.isOpen}
        onClose={() => setRemoveConfirmation({ isOpen: false, member: null })}
        title={`Remove ${
          removeConfirmation.member
            ? getFullName(removeConfirmation.member)
            : 'User'
        }?`}
        description="This action cannot be undone."
        variant="danger"
        primaryAction={{
          label: isRemoving ? 'Removing…' : 'Remove User',
          onClick: () => {
            if (removeConfirmation.member) {
              void handleRemoveMember(removeConfirmation.member);
            }
          },
          isLoading: isRemoving,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setRemoveConfirmation({ isOpen: false, member: null }),
        }}
      />
    </div>
  );
}

/** Star icon for org owner indicator. */
function StarIcon({ className }: { className?: string }) {
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

function MemberCard({
  member,
  renderAction,
}: {
  member: OrganizationMemberType;
  renderAction: (m: OrganizationMemberType) => React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 w-8 h-8 rounded-full bg-[#F4F6FD] flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-[#008CEE]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">
            {getFullName(member)}
          </div>
          <div className="text-xs text-[#747A82] truncate">
            {roleLabel(member)}
          </div>
        </div>
        {member.isOrgOwner && (
          <span title="Organization Owner" className="text-amber-500 shrink-0">
            <StarIcon className="w-3.5 h-3.5" />
          </span>
        )}
        <div className="shrink-0">{renderAction(member)}</div>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-gray-50 text-xs">
        <div className="truncate mb-1.5">
          <span className="text-[#A0A5AE]">Email: </span>
          <span className="text-gray-900">{member.email ?? '—'}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <div className="min-w-0 truncate">
            <span className="text-[#A0A5AE]">Created: </span>
            <span className="text-gray-900">
              {formatRelativeDate(member.dateJoined) ?? '—'}
            </span>
          </div>
          <div className="min-w-0 truncate">
            <span className="text-[#A0A5AE]">Last Login: </span>
            <span className="text-gray-900">
              {formatRelativeDate(member.lastLogin) ?? 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center py-8 text-sm text-[#747A82]">
      {text}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex justify-center mt-4 space-x-2">
      <Button
        variant="primary-sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        ‹ Prev
      </Button>
      <span className="flex items-center px-4 text-sm text-[#747A82]">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="primary-sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next ›
      </Button>
    </div>
  );
}
