import { extractOperationInfoMessage, toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperatorShelterType } from '../../apollo/graphql/__generated__/types';
import { useBeds, type UseBedsResultType } from '../../hooks/useBeds';
import { useCloneBed } from '../../hooks/useCloneBed';
import { useDeleteBeds } from '../../hooks/useDeleteBeds';
import { useUpdateBed } from '../../hooks/useUpdateBed';
import {
  shelterCreateBedRoute,
  shelterCreateReservationRoute,
  shelterEditBedRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { BedTable, type Bed, type BedRowObject } from '../BedTable';

const UNASSIGNED_ROOM_ID = 'unassigned-room';
const UNASSIGNED_ROOM_LABEL = 'Unassigned';

function toBedRow(
  bedData: UseBedsResultType[number],
  roomId: string,
  roomAssignment: string
): Bed {
  return {
    __typename: 'BedType',
    id: bedData.id,
    name: bedData.name,
    status: bedData.status,
    maintenanceFlag: bedData.maintenanceFlag,
    type: bedData.type ?? null,
    accessibility: [],
    b7: false,
    demographics: [],
    funders: [],
    medicalNeeds: [],
    pets: [],
    shelter: {} as OperatorShelterType,
    storage: false,
    roomId,
    roomAssignment,
  };
}

export function BedsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { beds: bedsData, loading, refetch } = useBeds(shelterId);

  const beds = useMemo<Bed[]>(() => {
    const grouped = new Map<string, Bed[]>();

    for (const bed of bedsData) {
      const roomId = bed.room?.id ?? UNASSIGNED_ROOM_ID;
      const roomAssignment = bed.room?.name ?? UNASSIGNED_ROOM_LABEL;
      const roomGroup = grouped.get(roomId) ?? [];

      roomGroup.push(toBedRow(bed, roomId, roomAssignment));

      grouped.set(roomId, roomGroup);
    }

    return Array.from(grouped.values()).flat();
  }, [bedsData]);

  const { cloneBed } = useCloneBed();
  const [cloneError, setCloneError] = useState<string | null>(null);

  const { deleteBeds } = useDeleteBeds();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { updateBed } = useUpdateBed();
  const [updateError, setUpdateError] = useState<string | null>(null);

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

  const handleClone = useCallback(
    async (rowObject: BedRowObject) => {
      const errorMsg = 'Unable to clone bed. Please try again.';
      setCloneError(null);
      try {
        const response = await cloneBed({ variables: { id: rowObject.id } });
        const errorMessage = extractOperationInfoMessage(response, 'cloneBed');
        if (errorMessage) {
          console.error(`error cloning bed: ${errorMessage}`);
          setCloneError(errorMsg);
          return;
        }
        await refetch();
      } catch (err) {
        const error = toError(err);

        console.error(`error cloning bed: ${error.message}`);
        setCloneError(errorMsg);
      }
    },
    [cloneBed, refetch]
  );

  const handleEdit = useCallback(
    (rowObject: BedRowObject) => {
      navigate(shelterEditBedRoute(shelterId, rowObject.id));
    },
    [navigate, shelterId]
  );

  const handleDeleteRequest = useCallback((bedIds: string[]) => {
    setDeleteConfirmation({ isOpen: true, bedIds });
  }, []);

  const handleDelete = useCallback(
    async (ids: string[]) => {
      const plural = ids.length > 1 ? 's' : '';
      const errorMsg = `Unable to delete bed${plural}. Please try again.`;

      setDeleteError(null);
      try {
        const response = await deleteBeds({
          variables: { data: { ids: ids } },
        });
        const errorMessage = extractOperationInfoMessage(
          response,
          'deleteBeds'
        );
        if (errorMessage) {
          console.error(`error deleting bed${plural}: ${errorMessage}`);
          setDeleteError(errorMsg);
          return;
        }
        await refetch();
      } catch (err) {
        const error = toError(err);

        console.error(`error deleting bed${plural}: ${error.message}`);
        setDeleteError(errorMsg);
      }
    },
    [deleteBeds, refetch]
  );

  const handleMarkReady = useCallback(
    async (rowObject: BedRowObject) => {
      const errorMsg = 'Unable to update bed. Please try again.';
      setUpdateError(null);
      try {
        const response = await updateBed({
          variables: {
            id: rowObject.id,
            data: { lastCleaned: new Date().toISOString() },
          },
        });
        const errorMessage = extractOperationInfoMessage(response, 'updateBed');
        if (errorMessage) {
          console.error(`error updating bed: ${errorMessage}`);
          setUpdateError(errorMsg);
          return;
        }
        await refetch();
      } catch (err) {
        const error = toError(err);

        console.error(`error updating bed: ${error.message}`);
        setUpdateError(errorMsg);
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
        bedId: rowObject.id,
        roomId:
          rowObject.roomId !== UNASSIGNED_ROOM_ID ? rowObject.roomId : null,
      };
      navigate(shelterCreateReservationRoute(shelterId), { state });
    },
    [navigate, shelterId]
  );

  return (
    <>
      {(cloneError || deleteError || updateError) && (
        <div
          className="mx-4 mt-4 flex items-start rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span className="flex-1">
            {cloneError || deleteError || updateError}
          </span>
          <button
            onClick={() => {
              setCloneError(null);
              setDeleteError(null);
              setUpdateError(null);
            }}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div>
        <BedTable
          beds={beds}
          loading={loading}
          onEdit={handleEdit}
          onClone={handleClone}
          onDeleteBeds={handleDeleteRequest}
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
              handleDelete(deleteConfirmation.bedIds);
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
