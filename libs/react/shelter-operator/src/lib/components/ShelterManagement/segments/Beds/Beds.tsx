import { isMutationSuccess, toError } from '@monorepo/react/shared';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBeds,
  useCloneBed,
  useDeleteBeds,
  useUpdateBed,
} from '../../../../hooks';
import { cloneBedMeta } from '../../../../hooks/useCloneBed/__generated__/useCloneBed_meta.generated';
import { deleteBedsMeta } from '../../../../hooks/useDeleteBeds/__generated__/useDeleteBeds_meta.generated';
import { updateBedMeta } from '../../../../hooks/useUpdateBed/__generated__/useUpdateBed_meta.generated';
import {
  shelterCreateResourceRoute,
  shelterEditResourceRoute,
} from '../../../../routing';
import { Button } from '../../../base-ui/buttons';
import { ConfirmationModal } from '../../../base-ui/modal/ConfirmationModal';
import { useToast } from '../../../base-ui/toast';
import { BedTable, type Bed } from './BedTable';

export function Beds({ shelterId }: { shelterId: string }) {
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
    async (bedId: string) => {
      try {
        const response = await cloneBed({ variables: { id: bedId } });

        if (
          !isMutationSuccess(
            response.data?.[cloneBedMeta.operationKey],
            cloneBedMeta.successTypename,
          )
        ) {
          throw new Error('Operation failed');
        }
      } catch (err) {
        const error = toError(err);
        console.error(`[cloneBed error]: ${error.message}`);

        showToast({
          status: 'error',
          title: 'Unable to clone bed. Please try again.',
          persistent: true,
        });
      }
    },
    [cloneBed, showToast],
  );

  const handleEdit = useCallback(
    (bedId: string) => {
      navigate(shelterEditResourceRoute(shelterId, 'bed', bedId));
    },
    [navigate, shelterId],
  );

  const handleDeleteRequest = useCallback((bedIds: string[]) => {
    setDeleteConfirmation({ isOpen: true, bedIds });
  }, []);

  const handleDelete = useCallback(
    async (ids: string[]) => {
      try {
        const response = await deleteBeds({ variables: { data: { ids } } });

        if (
          !isMutationSuccess(
            response.data?.[deleteBedsMeta.operationKey],
            deleteBedsMeta.successTypename,
          )
        ) {
          throw new Error('Operation failed');
        }
      } catch (err) {
        const error = toError(err);
        console.error(`[deleteBeds error]: ${error.message}`);

        showToast({
          status: 'error',
          title: `Unable to delete bed${ids.length > 1 ? 's' : ''}. Please try again.`,
          persistent: true,
        });
      }
    },
    [deleteBeds, showToast],
  );

  const handleMarkReady = useCallback(
    async (bedId: string) => {
      try {
        const response = await updateBed({
          variables: {
            id: bedId,
            data: { lastCleaned: new Date().toISOString() },
          },
        });

        if (
          !isMutationSuccess(
            response.data?.[updateBedMeta.operationKey],
            updateBedMeta.successTypename,
          )
        ) {
          throw new Error('Operation failed');
        }
      } catch (err) {
        const error = toError(err);
        console.error(`[updateBed error]: ${error.message}`);

        showToast({
          status: 'error',
          title: 'Unable to update bed. Please try again.',
          persistent: true,
        });
      }
    },
    [updateBed, showToast],
  );

  const [readyBedId, setReadyBedId] = useState<string | null>(null);

  const closeReadyConfirmation = useCallback(() => {
    setReadyBedId(null);
  }, []);

  const handleMarkReadyRequest = useCallback((bedId: string) => {
    setReadyBedId(bedId);
  }, []);

  const handleReserve = useCallback(
    (bed: Bed) => {
      const state: Record<string, string | null> = {
        bedId: bed.id,
        roomId: bed.room?.id ?? null,
      };
      navigate(shelterCreateResourceRoute(shelterId, 'reservation'), { state });
    },
    [navigate, shelterId],
  );
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

      {readyBedId && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeReadyConfirmation}
          variant="success"
          title="Mark bed as ready?"
          description="This will mark the bed as cleaned and ready for use."
          primaryAction={{
            label: 'Mark Ready',
            onClick: async () => {
              await handleMarkReady(readyBedId);
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
          onClick={() => navigate(shelterCreateResourceRoute(shelterId, 'bed'))}
        >
          Create Bed
        </Button>
      </div>
    </>
  );
}
