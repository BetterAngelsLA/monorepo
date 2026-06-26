import { Colors } from '@monorepo/expo/shared/static';
import { TModalPresentationType } from '../../providers';

export const defaultModalNavOpts: Record<
  TModalPresentationType,
  Record<string, unknown>
> = {
  card: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_DARK_BLUE,
    },
    headerTitleStyle: {
      color: Colors.WHITE,
    },
  },
  modal: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_STEEL_BLUE,
    },
    headerTitleStyle: {
      color: Colors.WHITE,
    },
    headerBackVisible: false,
  },
  fullScreenModal: {
    headerTitleAlign: 'center',
    headerStyle: {
      backgroundColor: Colors.BRAND_STEEL_BLUE,
    },
    headerTitleStyle: {
      color: Colors.WHITE,
    },
    headerBackVisible: false,
  },
};
