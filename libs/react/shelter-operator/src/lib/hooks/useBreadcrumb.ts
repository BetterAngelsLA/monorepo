import { useLocation, useParams } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  path?: string;
};

export function useBreadcrumb(): BreadcrumbItem[] {
  const location = useLocation();
  const params = useParams<{ id?: string; shelterId?: string }>();

  const pathname = location.pathname;

  if (pathname === '/operator' || pathname === '/operator/dashboard') {
    return [];
  }

  if (pathname.includes('/dashboard/create')) {
    return [{ label: 'Create Shelter' }];
  }

  const shelterId = params.shelterId || params.id;
  if (shelterId) {
    const breadcrumbs: BreadcrumbItem[] = [];

    breadcrumbs.push({
      label: 'Loading...',
      path: `/operator/shelter/${shelterId}`,
    });

    if (pathname.includes('/reservation')) {
      breadcrumbs.push({ label: 'Shelter Reservation' });
    } else if (pathname === `/operator/shelter/${shelterId}`) {
      breadcrumbs.push({ label: 'Dashboard' });
    }

    return breadcrumbs;
  }

  return [];
}
