import {
  ReportPermissions,
  TeamPermissions,
  UserOrganizationPermissions,
} from '@monorepo/ba-platform/permissions';
import { RouteObject } from 'react-router-dom';
import Home from '../pages/home';
import { ReportsPage } from '../pages/reports';
import { ServicesPage } from '../pages/services';
import { TeamsPage } from '../pages/teams';
import { UsersPage } from '../pages/users';
import { PermissionGuard } from './PermissionGuard';

export const routeChildren: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/users',
    element: (
      <PermissionGuard permission={UserOrganizationPermissions.ViewOrgMembers}>
        <UsersPage />
      </PermissionGuard>
    ),
  },
  {
    path: '/reports',
    element: (
      <PermissionGuard permission={ReportPermissions.ViewReports}>
        <ReportsPage />
      </PermissionGuard>
    ),
  },
  {
    path: '/teams',
    element: (
      <PermissionGuard permission={TeamPermissions.View}>
        <TeamsPage />
      </PermissionGuard>
    ),
  },
  {
    path: '/services',
    element: <ServicesPage />,
  },
];
