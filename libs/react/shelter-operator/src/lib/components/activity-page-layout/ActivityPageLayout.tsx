import { Link } from 'react-router-dom';

export interface ActivityPageLayoutProps {
  /** URL for the "Back to Xxx" link */
  backLinkPath: string;
  /** Text for the back link, e.g. "Back to Beds" */
  backLinkLabel: string;
  /** Page title, e.g. "Bed activity" */
  title: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for per-resource activity pages. Kept separate from
 * `ManageFormPageLayout`, which always titles "Edit"/"Create".
 */
export function ActivityPageLayout({
  backLinkPath,
  backLinkLabel,
  title,
  children,
}: ActivityPageLayoutProps) {
  return (
    <div className="space-y-6 p-8">
      <Link
        to={backLinkPath}
        className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        {backLinkLabel}
      </Link>

      <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>

      {children}
    </div>
  );
}
