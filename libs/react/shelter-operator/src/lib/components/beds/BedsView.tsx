import { useMutation, useQuery } from '@apollo/client/react';
import { isMutationSuccess } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BedType } from '@monorepo/ba-platform/types';
import {
  shelterCreateBedRoute,
  shelterCreateReservationRoute,
  shelterEditBedRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { BedTable, type BedRoomForList, type BedRowObject } from '../BedTable';
import {
  CloneBedDocument,
  DeleteBedsDocument,
  UpdateBedDocument,
  UpdateBedMutation,
  UpdateBedMutationVariables,
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

export function BedsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<
    GetBedsQuery,
    GetBedsQueryVariables
  >(GetBedsDocument, {
    variables: { shelterId },
    skip: !shelterId,
  });

  const [cloneBed] = useMutation<CloneBedMutation, CloneBedMutationVariables>(
    CloneBedDocument
  );

  const [deleteBeds] = useMutation<
    DeleteBedsMutation,
    DeleteBedsMutationVariables
  >(DeleteBedsDocument);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    bedIds: string[];
  }>({ isOpen: false, bedIds: [] });

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({ isOpen: false, bedIds: [] });
  }, []);

  const deleteConfirmationTitle =
    deleteConfirmation.bedIds.length === 1
      ? 'Are you sure you want to delete the selected bed?'
      : `Are you sure you want to delete the ${deleteConfirmation.bedIds.length} selected beds?`;

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
          variables: { id: rowObject.bedId },
          errorPolicy: 'all',
        });

        if (result?.cloneBed?.__typename === 'OperationInfo') {
          const firstMessage = result.cloneBed.messages?.[0]?.message;
          setActionError(
            firstMessage || 'Unable to clone bed. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.cloneBed, 'BedType')) {
          setActionError('An unexpected error occurred. Please try again.');
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [cloneBed, refetch]
  );

  const handleDeleteBedsRequest = useCallback((bedIds: string[]) => {
    setDeleteConfirmation({ isOpen: true, bedIds });
  }, []);

  const handleDeleteBeds = useCallback(
    async (bedIds: string[]) => {
      setActionError(null);
      try {
        const { data: result } = await deleteBeds({
          variables: { data: { ids: bedIds } },
          errorPolicy: 'all',
        });

        if (result?.deleteBeds?.__typename === 'OperationInfo') {
          const firstMessage = result.deleteBeds.messages?.[0]?.message;
          setActionError(
            firstMessage || 'Unable to delete bed(s). Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.deleteBeds, 'BulkDeleteResult')) {
          setActionError('An unexpected error occurred. Please try again.');
          return;
        }

        await refetch();
      } catch {
        setActionError('Unable to delete bed(s). Please try again.');
      }
    },
    [deleteBeds, refetch]
  );
  const refetchQueries = useMemo(
    () => [{ query: GetBedsDocument, variables: { shelterId } }],
    [shelterId]
  );
  const [updateBed] = useMutation<
    UpdateBedMutation,
    UpdateBedMutationVariables
  >(UpdateBedDocument, { refetchQueries });
  const handleMarkReady = useCallback(
    async (rowObject: BedRowObject) => {
      setActionError(null);
      try {
        const { data: result } = await updateBed({
          variables: {
            id: rowObject.bedId,
            data: {
              lastCleaned: new Date().toISOString(),
            },
          },
          errorPolicy: 'all',
        });

        if (result?.updateBed?.__typename === 'OperationInfo') {
          const firstMessage = result.updateBed.messages?.[0]?.message;
          setActionError(
            firstMessage || 'Unable to update bed. Please try again.'
          );
          return;
        }
        if (!isMutationSuccess(result?.updateBed, 'BedType')) {
          setActionError('An unexpected error occurred. Please try again.');
          return;
        }

        await refetch();
      } catch {
        setActionError('A network error occurred. Please try again.');
      }
    },
    [updateBed, refetch]
  );

  const [readyConfirmation, setReadyConfirmation] = useState<{
    isOpen: boolean;
    rowObject: BedRowObject | null;
  }>({ isOpen: false, rowObject: null });

  const closeReadyConfirmation = useCallback(() => {
    setReadyConfirmation({ isOpen: false, rowObject: null });
  }, []);

  const handleMarkReadyRequest = useCallback((rowObject: BedRowObject) => {
    setReadyConfirmation({ isOpen: true, rowObject });
  }, []);

  const handleReserve = useCallback(
    (rowObject: BedRowObject) => {
      const state: Record<string, string | null> = {
        bedId: rowObject.bedId,
        roomId:
          rowObject.roomId !== UNASSIGNED_ROOM_ID ? rowObject.roomId : null,
      };
      navigate(shelterCreateReservationRoute(shelterId), { state });
    },
    [navigate, shelterId]
  );

  return (
    <>
      {actionError && (
        <div
          className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <div>
        <BedTable
          rooms={rooms}
          loading={loading}
          onEdit={handleEdit}
          onClone={handleClone}
          onDeleteBeds={handleDeleteBedsRequest}
          onMarkReady={handleMarkReadyRequest}
          onReserve={handleReserve}
        />
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        variant="danger"
        title={deleteConfirmationTitle}
        description="This action cannot be undone."
        primaryAction={{
          label: 'Delete',
          onClick: () => {
            if (deleteConfirmation.bedIds.length > 0) {
              handleDeleteBeds(deleteConfirmation.bedIds);
            }
            closeDeleteConfirmation();
          },
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeDeleteConfirmation,
        }}
      />

      <ConfirmationModal
        isOpen={readyConfirmation.isOpen}
        onClose={closeReadyConfirmation}
        variant="success"
        title="Mark bed as ready?"
        description="This will mark the bed as cleaned and ready for use."
        primaryAction={{
          label: 'Mark Ready',
          onClick: () => {
            if (readyConfirmation.rowObject) {
              handleMarkReady(readyConfirmation.rowObject);
            }
            closeReadyConfirmation();
          },
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeReadyConfirmation,
        }}
      />

      <div className="fixed bottom-6 right-6 text-sm z-20 ">
        <Button
          leftIcon={<Plus />}
          rightIcon={false}
          variant="floating"
          onClick={() => navigate(shelterCreateBedRoute(shelterId))}
        >
          Create Bed
        </Button>
      </div>
    </>
  );
}
