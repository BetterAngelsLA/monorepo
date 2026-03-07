import { BaShelterLogoIcon } from '@monorepo/react/icons';
import { UserCog } from 'lucide-react';

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
  const breadcrumbs = [organizationName, shelterName, pageTitle].filter(
    Boolean
  );

  return (
    <header className="flex items-center justify-between w-full py-3 px-6 bg-[#FAFAFA] mb-4">
      <div className="flex items-center gap-7">
        <BaShelterLogoIcon className="w-8 h-8 text-black" fill="black" />
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-base">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? 'font-medium'
                      : 'font-normal'
                  }
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        className="p-2 hover:bg-gray-100 border-[1px] rounded-full transition-colors"
        aria-label="User menu"
      >
        <UserCog className="w-6 h-6 text-gray-600" />
      </button>
    </header>
  );
}
