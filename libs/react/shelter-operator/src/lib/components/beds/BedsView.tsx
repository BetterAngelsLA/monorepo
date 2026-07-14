import { getFieldErrorsOrThrow } from '@monorepo/ba-platform';
import { toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type BedType } from '@monorepo/ba-platform/types';
import { useBeds, useCloneBed, useDeleteBeds, useUpdateBed } from '../../hooks';
import { cloneBedMeta } from '../../hooks/useCloneBed/__generated__/useCloneBed_meta.generated';
import { deleteBedsMeta } from '../../hooks/useDeleteBeds/__generated__/useDeleteBeds_meta.generated';
import { updateBedMeta } from '../../hooks/useUpdateBed/__generated__/useUpdateBed_meta.generated';
import {
  shelterCreateBedRoute,
  shelterCreateReservationRoute,
  shelterEditBedRoute,
} from '../../routing';
import { Button } from '../base-ui/buttons';
import { ConfirmationModal } from '../base-ui/modal/ConfirmationModal';
import { useToast } from '../base-ui/toast';
import { BedTable, type Bed, type BedRowObject } from '../BedTable';

export function BedsView({ shelterId }: { shelterId: string }) {
  const navigate = useNavigate();

  const { beds: bedsData, loading } = useBeds(shelterId);

  const beds = useMemo<Bed[]>(() => {
    const grouped = new Map<string, Bed[]>();

    for (const bed of bedsData) {
      const roomId = bed.room?.id ?? 'unassigned';
      const roomGroup = grouped.get(roomId) ?? [];
      roomGroup.push(bed);
      grouped.set(roomId, roomGroup);
    }

    return Array.from(grouped.values()).flat();
  }, [bedsData]);

  const { cloneBed } = useCloneBed({ shelterId });

  const { deleteBeds } = useDeleteBeds({ shelterId });

  const { updateBed } = useUpdateBed();

  const { showToast } = useToast();

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
      const errorMessage = 'Unable to clone bed. Please try again.';

      try {
        const response = await cloneBed({ variables: { id: rowObject.id } });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...cloneBedMeta,
          fields: ['id'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error cloning bed: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [cloneBed, showToast]
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
      const errorMessage = `Unable to delete bed${plural}. Please try again.`;

      try {
        const response = await deleteBeds({ variables: { data: { ids } } });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...deleteBedsMeta,
          fields: ['ids'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error deleting bed${plural}: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [deleteBeds, showToast]
  );

  const handleMarkReady = useCallback(
    async (rowObject: BedRowObject) => {
      const errorMessage = 'Unable to update bed. Please try again.';

      try {
        const response = await updateBed({
          variables: {
            id: rowObject.id,
            data: { lastCleaned: new Date().toISOString() },
          },
        });

        const fieldErrors = getFieldErrorsOrThrow({
          response,
          ...updateBedMeta,
          fields: ['lastCleaned'],
        });
        if (fieldErrors.length) {
          throw new Error(errorMessage);
        }
      } catch (err) {
        const error = toError(err);
        console.error(`error updating bed: ${error.message}`);
        showToast({
          status: 'error',
          title: errorMessage,
          persistent: true,
        });
      }
    },
    [updateBed, showToast]
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
        roomId: rowObject.bed.room?.id ?? null,
      };
      navigate(shelterCreateReservationRoute(shelterId), { state });
    },
    [navigate, shelterId]
  );
  const readyRowObject = readyConfirmation.rowObject;

  return (
    <>
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
          onClick: async () => {
            await handleDelete(deleteConfirmation.bedIds);
            closeDeleteConfirmation();
          },
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: closeDeleteConfirmation,
        }}
      />

      {readyRowObject && (
        <ConfirmationModal
          isOpen={readyConfirmation.isOpen}
          onClose={closeReadyConfirmation}
          variant="success"
          title="Mark bed as ready?"
          description="This will mark the bed as cleaned and ready for use."
          primaryAction={{
            label: 'Mark Ready',
            onClick: async () => {
              await handleMarkReady(readyRowObject);
              closeReadyConfirmation();
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: closeReadyConfirmation,
          }}
        />
      )}

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
