import { BaShelterLogoIcon, UserIcon } from '@monorepo/react/icons';

interface OperatorHeaderProps {
  organizationName?: string;
  shelterName?: string;
  pageTitle?: string;
}

export function OperatorHeader({
  organizationName,
  shelterName,
  pageTitle,
}: OperatorHeaderProps) {
  const breadcrumbs = [organizationName, shelterName, pageTitle].filter(Boolean);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <BaShelterLogoIcon className="w-8 h-8" />
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-base">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'font-normal' : 'font-medium'}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="User menu"
      >
        <UserIcon className="w-6 h-6 text-gray-600" />
      </button>
    </header>
  );
}
