import { Colors } from '@monorepo/expo/shared/static';
import { TModalPresentationType } from '../../providers';

export const defaultModalNavOpts: Record<
  TModalPresentationType,
  Record<string, unknown>
> = {
  card: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_DARK_BLUE as string,
    },
    headerTitleStyle: {
      color: Colors.WHITE as string,
    },
  },
  modal: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_STEEL_BLUE as string,
    },
    headerTitleStyle: {
      color: Colors.WHITE as string,
    },
    headerBackVisible: false,
  },
  fullScreenModal: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_STEEL_BLUE as string,
    },
    headerTitleStyle: {
      color: Colors.WHITE as string,
    },
    headerBackVisible: false,
  },
};
