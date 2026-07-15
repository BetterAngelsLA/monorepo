/**
 * Shared default storage key for active organization ID.
 * Used by ``orgLink`` (Apollo link) and ``useActiveOrgState`` (React hook)
 * so they stay in sync without hard-coding the same string in multiple places.
 */
export const DEFAULT_ORG_STORAGE_KEY = 'betterangels_active_org_id';

/**
 * Single source of truth for the maximum upload file size (50 MiB).
 *
 * Must stay in sync with the Django env defaults in
 * ``apps/betterangels-backend/betterangels_backend/settings.py``:
 *
 * - ``SHELTER_PHOTO_MAX_FILE_SIZE``
 * - ``NOTE_ATTACHMENT_MAX_FILE_SIZE``
 * - ``CLIENT_DOCUMENT_MAX_FILE_SIZE``
 * - ``S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE``
 *
 * If the backend limit changes without updating this constant, the client-side
 * file-size check will pass but S3 will reject the upload with ``EntityTooLarge``
 * — producing a confusing, silent error for end users.
 *
 * TODO: As upload configuration grows more complex (multiple size tiers,
 * per-content-type limits, etc.), replace this hardcoded constant with a
 * server-driven configuration endpoint so the app has a single authoritative
 * source at runtime instead of compile time.
 */
export const UPLOAD_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MiB
