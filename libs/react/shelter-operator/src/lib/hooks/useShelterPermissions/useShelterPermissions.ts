import { useActiveOrg } from '@monorepo/ba-platform';
import {
  BedPermissions,
  ReservationPermissions,
  RoomPermissions,
  ShelterPermissions,
} from '@monorepo/ba-platform/permissions';

/**
 * Capability gates for the shelter operator surface, keyed off the active
 * org's effective permission entry (the grant model's per-org contract).
 * Mirrors the backend authority — the UI should not offer actions the backend
 * will deny.
 */
export function useShelterPermissions() {
  const { hasPermission } = useActiveOrg();

  return {
    canCreateShelter: hasPermission(ShelterPermissions.Add),
    canEditShelter: hasPermission(ShelterPermissions.Change),
    canDeleteShelter: hasPermission(ShelterPermissions.Delete),

    canAddBed: hasPermission(BedPermissions.Add),
    canEditBed: hasPermission(BedPermissions.Change),
    canDeleteBed: hasPermission(BedPermissions.Delete),

    canAddRoom: hasPermission(RoomPermissions.Add),
    canEditRoom: hasPermission(RoomPermissions.Change),
    canDeleteRoom: hasPermission(RoomPermissions.Delete),

    canAddReservation: hasPermission(ReservationPermissions.Add),
    canEditReservation: hasPermission(ReservationPermissions.Change),
    canDeleteReservation: hasPermission(ReservationPermissions.Delete),
  };
}
