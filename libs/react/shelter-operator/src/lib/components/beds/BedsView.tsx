import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BedType } from '../../apollo/graphql/__generated__/types';
import { shelterCreateBedRoute, shelterEditBedRoute } from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { BedTable, type BedRoomForList, type BedRowObject } from '../BedTable';
import {
  CloneBedDocument,
  DeleteBedsDocument,
  type CloneBedMutation,
  type CloneBedMutationVariables,
  type DeleteBedsMutation,
  type DeleteBedsMutationVariables,
} from './api/__generated__/bedMutations.generated';
import {
  GetBedsDocument,
  type GetBedsQuery,
  type GetBedsQueryVariables,
} from './api/__generated__/bedQueries.generated';

const UNASSIGNED_ROOM_ID = 'unassigned-room';
const UNASSIGNED_ROOM_LABEL = 'Unassigned';

type DeleteConfirmationState = {
  isOpen: boolean;
  bedId?: string;
  name?: string;
};

export function BedsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationState>({ isOpen: false });
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<
    GetBedsQuery,
    GetBedsQueryVariables
  >(GetBedsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const refetchQueries = useMemo(
    () => [{ query: GetBedsDocument, variables: { shelterId } }],
    [shelterId]
  );

  const [cloneBed] = useMutation<CloneBedMutation, CloneBedMutationVariables>(
    CloneBedDocument,
    { refetchQueries }
  );

  const [deleteBed] = useMutation<
    DeleteBedsMutation,
    DeleteBedsMutationVariables
  >(DeleteBedsDocument, { refetchQueries });

  const rooms = useMemo<BedRoomForList[]>(() => {
    const grouped = new Map<string, BedRoomForList>();

    for (const bed of data?.beds.results ?? []) {
      const roomId = bed.room?.id ?? UNASSIGNED_ROOM_ID;
      const roomLabel = bed.room?.name ?? UNASSIGNED_ROOM_LABEL;
      const roomGroup = grouped.get(roomId) ?? {
        id: roomId,
        roomLabel,
        beds: [],
      };

      roomGroup.beds.push({
        __typename: 'BedType',
        id: bed.id,
        accessibility: [],
        b7: false,
        demographics: [],
        funders: [],
        maintenanceFlag: bed.maintenanceFlag,
        medicalNeeds: [],
        name: bed.name,
        pets: [],
        shelter: {} as never,
        status: bed.status,
        storage: false,
        type: bed.type ?? null,
      } as unknown as BedType);

      grouped.set(roomId, roomGroup);
    }

    return Array.from(grouped.values());
  }, [data?.beds.results]);

  const handleEdit = useCallback(
    (rowObject: BedRowObject) => {
      navigate(shelterEditBedRoute(shelterId, rowObject.bedId));
    },
    [navigate, shelterId]
  );

  const handleClone = useCallback(
    async (rowObject: BedRowObject) => {
      setActionError(null);
      try {
        const { data: result } = await cloneBed({
          variables: { id: rowObject.bedId, shelterId },
          errorPolicy: 'all',
        });

        const payload = result?.cloneBed;
        if (payload?.__typename === 'OperationInfo') {
          setActionError(
            payload.messages?.[0]?.message ||
              'Unable to duplicate bed. Please try again.'
          );
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [cloneBed, refetch, shelterId]
  );

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({ isOpen: false });
  };

  const confirmDelete = async () => {
    const bedId = deleteConfirmation.bedId;
    if (!bedId) return;

    setActionError(null);
    try {
      const { data: result } = await deleteBed({
        variables: { data: { ids: [bedId] } },
        errorPolicy: 'all',
      });

      const payload = result?.deleteBeds;
      if (payload?.__typename === 'OperationInfo') {
        setActionError(
          payload.messages?.[0]?.message ||
            'Unable to delete bed. Please try again.'
        );
        return;
      }

      closeDeleteConfirmation();
      await refetch();
    } catch {
      setActionError('A network error occurred. Please try again.');
    }
  };

  return (
    <>
      {actionError ? (
        <div
          className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      <BedTable
        rooms={rooms}
        loading={loading}
        onEdit={handleEdit}
        onClone={handleClone}
        onDelete={(rowObject) => {
          setDeleteConfirmation({
            isOpen: true,
            bedId: rowObject.bedId,
            name: rowObject.name || rowObject.bedId,
          });
        }}
      />

      <div className="fixed bottom-6 right-6 z-20 text-sm">
        <Button
          leftIcon={<Plus />}
          rightIcon={false}
          variant="floating"
          onClick={() => navigate(shelterCreateBedRoute(shelterId))}
        >
          Create Bed
        </Button>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        variant="danger"
        title={`Are you sure you want to delete ${
          deleteConfirmation.name || 'this bed'
        }?`}
        description="This action cannot be undone."
        primaryAction={{
          label: 'Delete',
          onClick: confirmDelete,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeDeleteConfirmation,
        }}
      />
    </>
  );
}
