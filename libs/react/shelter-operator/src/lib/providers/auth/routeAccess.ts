import { operatorPath } from '@monorepo/react/shelter';
import { paths } from '../../routing';

export const routeAccess = {
  [operatorPath]: 'safe',
  [paths.signIn]: 'unsafe',
} as const;
