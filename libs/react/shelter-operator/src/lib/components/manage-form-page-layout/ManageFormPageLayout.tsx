import { Link } from 'react-router-dom';

export interface ManageFormPageLayoutProps {
  /** Route param — renders nothing when missing */
  shelterId: string | undefined;
  /** URL for the "Back to Xxx" link */
  backLinkPath: string;
  /** Text for the back link, e.g. "Back to Rooms" */
  backLinkLabel: string;
  /** Entity ID route param — determines edit vs create; gates loading/error states */
  entityId: string | undefined;
  /** Whether the entity query is loading */
  loading: boolean;
  /** Whether there was an error or the entity was not found */
  hasError: boolean;
  /** Optional error message override; defaults to "Unable to load this {entityName}." */
  errorMessage?: string;
  /** Lowercase entity name for messages, e.g. "room" */
  entityName: string;
  /** Capitalized entity label for the title, e.g. "Room" */
  entityLabel: string;
  /** Optional subtitle shown only in create mode */
  createSubtitle?: string;
  /** The form to render */
  children: React.ReactNode;
}

/**
 * Shared page layout for Bed, Room, and Reservation create/edit pages.
 *
 * Handles four render states:
 * 1. Missing shelterId → null
 * 2. Loading (editing an existing entity) → "Loading {entityName}…"
 * 3. Error / not found (editing) → back link + error message
 * 4. Normal → back link, title (Edit/Create), optional create subtitle, children
 */
export function ManageFormPageLayout({
  shelterId,
  backLinkPath,
  backLinkLabel,
  entityId,
  loading,
  hasError,
  errorMessage,
  entityName,
  entityLabel,
  createSubtitle,
  children,
}: ManageFormPageLayoutProps) {
  if (!shelterId) {
    return null;
  }

  if (entityId && loading) {
    return (
      <div className="p-8 text-sm text-gray-600" role="status">
        Loading {entityName}…
      </div>
    );
  }

  if (entityId && hasError) {
    return (
      <div className="space-y-4 p-8">
        <Link
          to={backLinkPath}
          className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {backLinkLabel}
        </Link>
        <p className="text-sm text-red-600" role="alert">
          {errorMessage ?? `Unable to load this ${entityName}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <Link
        to={backLinkPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        {backLinkLabel}
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          {entityId ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
        </h1>
        {!entityId && createSubtitle && (
          <p className="mt-2 text-sm text-gray-600">{createSubtitle}</p>
        )}
      </div>

      {children}
    </div>
  );
}
