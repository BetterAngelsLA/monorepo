import { useMutation, useQuery } from '@apollo/client/react';
import {
  SearchInput,
  Table,
  useAlert,
  useAppDrawer,
} from '@monorepo/react/components';
import { GroupsIcon, PlusIcon, ThreeDotIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { JSX, useRef, useState } from 'react';
import {
  Ordering,
  TeamPermissions,
  TeamType,
} from '../../apollo/graphql/__generated__/types';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import { useOutsideClick } from '../../hooks';
import { useActiveOrg } from '../../providers';
import {
  AdminTeamsDocument,
  DeleteTeamDocument,
} from './__generated__/teams.generated';
import { AddTeamDrawer } from './AddTeamDrawer';

type IProps = {
  className?: string;
};

type SortField = 'name' | 'createdAt';

const COLUMNS: {
  label: string;
  field: SortField;
  render: (t: TeamType) => string | JSX.Element;
}[] = [
  { label: 'Name', field: 'name', render: (t) => t.name },
  {
    label: 'Created',
    field: 'createdAt',
    render: (t) => (
      <span className="text-right w-full block">
        {t.createdAt
          ? formatDistanceToNow(parseISO(t.createdAt), { addSuffix: true })
          : '\u2014'}
      </span>
    ),
  },
];

export function TeamsPage(props: IProps) {
  const { className } = props;
  const { hasPermission } = useActiveOrg();
  const { showDrawer } = useAppDrawer();
  const { showAlert } = useAlert();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{
    field: SortField;
    direction: Ordering;
  }>({ field: 'name', direction: Ordering.Asc });
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(
    menuRef,
    () => setOpenMenuRowId(null),
    openMenuRowId !== null
  );

  const { data, loading, previousData, refetch } = useQuery(
    AdminTeamsDocument,
    { fetchPolicy: 'cache-and-network' }
  );

  const [deleteTeam, { loading: deleting }] = useMutation(DeleteTeamDocument);

  const activeData = data ?? previousData;
  const teams = activeData?.teams?.results ?? [];
  const isInitialLoad = loading && !activeData;

  const parentCss = [
    'flex-1',
    'min-h-0',
    'overflow-x-auto',
    loading && 'opacity-50 transition-opacity duration-200',
    className,
  ];

  const formatCreatedDate = (iso: string | null | undefined): string =>
    iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '\u2014';

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleDelete = async (team: TeamType) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const response = await deleteTeam({
        variables: { data: { id: team.id } },
      });
      const error = extractOperationInfoMessage(response, 'deleteTeam');
      if (error) throw new Error(error);
      showAlert({
        type: 'success',
        content: `${team.name} successfully deleted.`,
      });
      refetch();
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

  const handleSort = (field: SortField) => {
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
      className={mergeCss([
        'flex items-center gap-1 hover:text-primary-60',
        col.field === 'createdAt' && 'justify-end w-full text-right',
      ])}
    >
      {col.label}
      {sort.field === col.field && (
        <span className="text-xs text-primary-20">
          {sort.direction === Ordering.Asc ? '\u25B2' : '\u25BC'}
        </span>
      )}
    </button>
  ));

  if (isInitialLoad)
    return <div className="flex justify-center py-20">Loading...</div>;

  // Filter/search client-side
  let displayTeams = teams;
  if (search) {
    const lower = search.toLowerCase();
    displayTeams = displayTeams.filter((t) =>
      t.name.toLowerCase().includes(lower)
    );
  }
  // Sort client-side
  displayTeams = [...displayTeams].sort((a, b) => {
    let cmp = 0;
    if (sort.field === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sort.field === 'createdAt') {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      cmp = aTime - bTime;
    }
    return sort.direction === Ordering.Asc ? cmp : -cmp;
  });

  const ThreeDotMenu = ({ team }: { team: TeamType }) => {
    const isOpen = openMenuRowId === team.id;
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuRowId((prev) => (prev === team.id ? null : team.id));
          }}
          className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-neutral-99 relative z-0"
        >
          <ThreeDotIcon className="w-6" fill="#052b73" />
        </button>
        {isOpen && (
          <div
            ref={menuRef}
            className="absolute flex flex-col items-start top-full right-0 shadow-md bg-white z-10 p-2 rounded-lg"
          >
            <button
              className="py-2 px-4 hover:bg-neutral-98 rounded-lg w-full text-left text-alert-60"
              onClick={() => void handleDelete(team)}
              disabled={deleting}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-10">
        <h1 className="mb-3 text-2xl font-bold">Manage Teams</h1>
        <p className="max-w-[800px]">
          Manage the teams available in your organization for outreach
          categorization.
        </p>
      </div>

      <div className="flex items-center justify-between gap-5 mb-6">
        <div>
          <SearchInput debounceMs={300} onChange={handleSearchChange} />
        </div>
        {hasPermission(TeamPermissions.Add) && (
          <button
            onClick={() =>
              showDrawer({
                content: (
                  <AddTeamDrawer
                    onSuccess={() => {
                      refetch();
                    }}
                  />
                ),
                contentClassName: 'p-0',
              })
            }
            className="btn btn-primary btn-lg gap-2 inline-flex items-center px-4"
          >
            <PlusIcon color="white" className="w-3 h-3" /> Add Team
          </button>
        )}
      </div>

      {!hasPermission(TeamPermissions.View) && (
        <div className="text-center py-10 text-neutral-60">
          You do not have permission to view teams.
        </div>
      )}

      {hasPermission(TeamPermissions.View) && displayTeams.length === 0 && (
        <div className="text-center py-10 text-neutral-60">
          {search
            ? 'No teams match your search.'
            : 'No teams in this organization.'}
        </div>
      )}

      {hasPermission(TeamPermissions.View) && displayTeams.length > 0 && (
        <>
            <>
              {/* ── Mobile: card layout (shown < lg, i.e. < 1024px) ── */}
              <div className="lg:hidden space-y-2 overflow-y-auto flex-1 min-h-0">
                {displayTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-95 flex items-center justify-center">
                        <GroupsIcon className="w-4 h-4 text-primary-40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {team.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {formatCreatedDate(team.createdAt)}
                        </div>
                      </div>
                      <ThreeDotMenu team={team} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Desktop: table layout (shown ≥ lg, i.e. ≥ 1024px) ── */}
              <div className={mergeCss(['hidden lg:flex', parentCss])}>
                <Table<TeamType>
                  action={(row) => <ThreeDotMenu team={row} />}
                  data={displayTeams}
                  header={headerButtons}
                  renderCell={(row, colIndex) => COLUMNS[colIndex].render(row)}
                />
              </div>
            </>
        </>
      )}
    </div>
  );
}
