import { useMutation, useQuery } from '@apollo/client/react';
import { Button, Table, useAlert } from '@monorepo/react/components';
import { PlusIcon } from '@monorepo/react/icons';
import { mergeCss, toError } from '@monorepo/react/shared';
import { ChangeEvent, KeyboardEvent, JSX, useState } from 'react';
import { TeamType } from '../../apollo/graphql/__generated__/types';
import { extractOperationInfoMessage } from '../../apollo/graphql/response/extractOperationInfoMessage';
import {
  AdminTeamsDocument,
  CreateTeamDocument,
  DeleteTeamDocument,
  UpdateTeamDocument,
} from './__generated__/teams.generated';

const HEADERS = ['Name', 'Slug', 'Active'];

const inputClass = 'border border-neutral-80 rounded px-2 py-1 w-full';

type TProps = {
  className?: string;
};

export default function Teams(props: TProps) {
  const { className = '' } = props;
  const { showAlert } = useAlert();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data, loading, refetch } = useQuery(AdminTeamsDocument, {
    fetchPolicy: 'cache-and-network',
  });

  const [createTeam, { loading: creating }] = useMutation(CreateTeamDocument);
  const [updateTeam, { loading: updating }] = useMutation(UpdateTeamDocument);
  const [deleteTeam, { loading: deleting }] = useMutation(DeleteTeamDocument);

  const teams = data?.teams ?? [];

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const response = await createTeam({
        variables: { data: { name: newName.trim() } },
      });
      const error = extractOperationInfoMessage(response, 'createTeam');
      if (error) throw new Error(error);
      setNewName('');
      refetch();
    } catch (err) {
      showAlert({ type: 'error', content: toError(err).message });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const response = await updateTeam({
        variables: { data: { id, name: editName.trim() } },
      });
      const error = extractOperationInfoMessage(response, 'updateTeam');
      if (error) throw new Error(error);
      setEditingId(null);
      setEditName('');
      refetch();
    } catch (err) {
      showAlert({ type: 'error', content: toError(err).message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const response = await deleteTeam({
        variables: { data: { id } },
      });
      const error = extractOperationInfoMessage(response, 'deleteTeam');
      if (error) throw new Error(error);
      refetch();
    } catch (err) {
      showAlert({ type: 'error', content: toError(err).message });
    }
  };

  const handleToggleActive = async (team: TeamType) => {
    try {
      const response = await updateTeam({
        variables: { data: { id: team.id, isActive: !team.isActive } },
      });
      const error = extractOperationInfoMessage(response, 'updateTeam');
      if (error) throw new Error(error);
      refetch();
    } catch (err) {
      showAlert({ type: 'error', content: toError(err).message });
    }
  };

  const containerClass = mergeCss(['flex flex-col gap-4', className]);

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
      </div>

      {loading && teams.length === 0 && (
        <div className="text-neutral-60 py-8 text-center">Loading teams...</div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm mb-1">New team name</label>
          <input
            className={inputClass}
            value={newName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewName(e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
          <PlusIcon className="w-4 h-4" />
          Add
        </Button>
      </div>

      <Table<TeamType>
        data={teams}
        header={HEADERS}
        renderCell={(team, colIndex) => {
          if (editingId === team.id && colIndex === 0) {
            return (
              <input
                className={inputClass}
                value={editName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditName(e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleUpdate(team.id);
                  if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditName('');
                  }
                }}
              />
            );
          }
          switch (colIndex) {
            case 0:
              return team.name;
            case 1:
              return team.slug;
            case 2:
              return team.isActive ? 'Yes' : 'No';
            default:
              return '';
          }
        }}
        action={(team) => (
          <div className="flex gap-2">
            {editingId === team.id ? (
              <>
                <Button onClick={() => handleUpdate(team.id)} disabled={updating}>
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setEditName('');
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setEditingId(team.id);
                    setEditName(team.name);
                  }}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleToggleActive(team)}
                  disabled={updating}
                >
                  {team.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button onClick={() => handleDelete(team.id)} disabled={deleting}>
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      )}
      />
    </div>
  );
}
