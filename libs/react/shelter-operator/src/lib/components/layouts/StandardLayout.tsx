import { ReactNode } from 'react';
import { useUser } from '@monorepo/react/shelter';
import { OperatorHeader } from '../OperatorHeader';

export interface StandardLayoutProps {
  children: ReactNode;
  organizationName?: string;
  shelterName?: string;
  pageTitle?: string;
}

export function StandardLayout({
  children,
  organizationName,
  shelterName,
  pageTitle,
}: StandardLayoutProps) {
  const { user } = useUser();
  const defaultOrgName = organizationName || user?.organization?.name;

  return (
    <div className="w-full flex flex-col min-h-screen bg-white">
      <OperatorHeader
        organizationName={defaultOrgName}
        shelterName={shelterName}
        pageTitle={pageTitle}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
