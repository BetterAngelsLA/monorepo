import { useMutation, useQuery } from '@apollo/client/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Ordering,
  OrganizationMemberOrdering,
  OrganizationMemberType,
  UserOrganizationPermissions,
} from '../../apollo/graphql/__generated__/types';
import { Button } from '../../components/base-ui/buttons/buttons';
import { ConfirmationModal } from '../../components/base-ui/modal/ConfirmationModal';
import { useToast } from '../../components/base-ui/toast';
import { Table, TableColumn } from '../../components/Table';
import { useActiveOrg } from '../../providers';
import { AddUserFormDrawer } from '../../components/AddUserForm';
import {
  OrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
} from './__generated__/users.generated';

const PAGE_SIZE = 25;

const ROLE_LABELS: Record<string, string> = {
  SHELTER_OPERATOR: 'Shelter Operator',
  ORG_ADMIN: 'Org Admin',
  ORG_SUPERUSER: 'Org Superuser',
  CASEWORKER: 'Caseworker',
  MEMBER: 'Member',
};

function humanizeRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

const COLUMNS: TableColumn<OrganizationMemberType>[] = [
  {
    key: 'firstName',
    label: 'First Name',
    render: (m) => m.firstName ?? '',
  },
  {
    key: 'lastName',
    label: 'Last Name',
    render: (m) => m.lastName ?? '',
  },
  {
    key: 'memberRole',
    label: 'Job Role',
    render: (m) => humanizeRole(m.memberRole),
  },
  {
    key: 'email',
    label: 'Email',
    render: (m) => m.email ?? '',
  },
  {
    key: 'dateJoined',
    label: 'Created At',
    render: (m) =>
      m.dateJoined
        ? formatDistanceToNow(parseISO(m.dateJoined), { addSuffix: true })
        : 'Unknown',
    width: '180px',
  },
  {
    key: 'lastLogin',
    label: 'Last Login',
    render: (m) =>
      m.lastLogin
        ? formatDistanceToNow(parseISO(m.lastLogin), { addSuffix: true })
        : 'Never',
    width: '180px',
  },
];

function useOrganizationMembers(
  orgId: string,
  page: number,
  sort: { field: keyof OrganizationMemberOrdering; direction: Ordering },
  search?: string
) {
  const { data, loading, previousData } = useQuery(
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
    isEmpty: !loading && totalCount === 0,
  };
}

interface RemoveConfirmation {
  isOpen: boolean;
  member: OrganizationMemberType | null;
}

export function UsersPage() {
  const { activeOrg, hasPermission } = useActiveOrg();
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

  const { members, totalPages, loading, isInitialLoad, isEmpty } =
    useOrganizationMembers(organizationId, page, sort, search);

  const canView = hasPermission(UserOrganizationPermissions.ViewOrgMembers);
  const canAdd = hasPermission(UserOrganizationPermissions.AddOrgMember);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  const handleRemoveMember = async (member: OrganizationMemberType) => {
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
        title: `${member.firstName ?? 'User'} ${member.lastName ?? ''} removed.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to remove user.';
      console.error('error removing user:', err);
      showToast({
        status: 'error',
        title: message,
      });
    } finally {
      setRemoveConfirmation({ isOpen: false, member: null });
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    showToast({
      status: 'success',
      title: 'User added successfully.',
    });
  };

  if (!organizationId) return null;

  if (isInitialLoad) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-[#747A82]">Loading...</p>
      </div>
    );
  }

  // Sortable header labels
  const sortableColumns = COLUMNS.map((col) => ({
    ...col,
    label: (
      <button
        type="button"
        onClick={() => handleSort(col.key as keyof OrganizationMemberOrdering)}
        className="flex items-center gap-1 hover:text-[#008CEE] transition-colors bg-transparent border-none cursor-pointer p-0 text-left font-medium text-[22px] text-[#747A82]"
      >
        {col.label as string}
        {sort.field === col.key && (
          <span className="text-xs">
            {sort.direction === Ordering.Asc ? '▲' : '▼'}
          </span>
        )}
      </button>
    ),
  }));

  const hasSearchResults = search.length > 0;
  const emptyMessage = hasSearchResults
    ? 'No users match your search.'
    : 'No users in this organization.';

  return (
    <div className="flex flex-col h-full">
      <div className="mb-10">
        <h1 className="mb-3 text-2xl font-bold text-[#383B40]">
          User Management
        </h1>
        <p className="max-w-[800px] text-[#747A82]">
          Manage users in your organization.
        </p>
      </div>

      <div className="flex items-center justify-between gap-5 mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
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
        <div className="flex flex-1">
          <Table<OrganizationMemberType>
            columns={sortableColumns}
            rows={members}
            getRowKey={(member) => member.id}
            getRowSlot={(member) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="trash"
                  onClick={() =>
                    setRemoveConfirmation({ isOpen: true, member })
                  }
                />
              </div>
            )}
            trailingHeader={<div className="w-16" />}
            loading={loading && !!members.length}
            loadingState={
              <div className="flex justify-center py-8 text-[#747A82]">
                Loading...
              </div>
            }
            emptyState={
              <div className="flex justify-center py-8 text-[#747A82]">
                {emptyMessage}
              </div>
            }
          />
        </div>
      ) : (
        <p className="text-[#747A82]">
          You don't have permission to view this organization's members.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="primary-sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ‹ Prev
          </Button>
          <span className="flex items-center px-4 text-sm text-[#747A82]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="primary-sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next ›
          </Button>
        </div>
      )}

      <AddUserFormDrawer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <ConfirmationModal
        isOpen={removeConfirmation.isOpen}
        onClose={() =>
          setRemoveConfirmation({ isOpen: false, member: null })
        }
        title={`Remove ${removeConfirmation.member?.firstName ?? 'User'} ${removeConfirmation.member?.lastName ?? ''}?`}
        description="This action cannot be undone."
        variant="danger"
        primaryAction={{
          label: isRemoving ? 'Removing…' : 'Remove User',
          onClick: () => {
            if (removeConfirmation.member) {
              handleRemoveMember(removeConfirmation.member);
            }
          },
          isLoading: isRemoving,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () =>
            setRemoveConfirmation({ isOpen: false, member: null }),
        }}
      />
    </div>
  );
}