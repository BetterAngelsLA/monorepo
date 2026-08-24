import { Colors } from '@monorepo/expo/shared/static';
import { ComponentType } from 'react';
import {
  ScreenHeaderBackButton,
  ScreenHeaderCloseButton,
} from './ScreenHeader/buttons';
import { THeaderVariant } from './types';

type THeaderButton = ComponentType<{ color?: Colors }> | null;

type THeaderVariantConfig = {
  backgroundColor: Colors;
  textColor: Colors;
  ButtonLeft: THeaderButton;
  ButtonRight: THeaderButton;
};

/**
 * What each header style is made of. The single definition every header
 * implementation reads — the in-app `ScreenHeader` renders it directly,
 * native headers project it through `getNativeHeaderOptions`.
 *
 * Keys are the pure `THeaderVariant` styles. Which header a surface gets
 * (native, custom, or none) is a separate decision: `THeaderMode`.
 */
export const headerVariants: Record<THeaderVariant, THeaderVariantConfig> = {
  screen: {
    backgroundColor: Colors.BRAND_DARK_BLUE,
    textColor: Colors.WHITE,
    ButtonLeft: ScreenHeaderBackButton,
    ButtonRight: null,
  },
  modal: {
    backgroundColor: Colors.BRAND_STEEL_BLUE,
    textColor: Colors.WHITE,
    ButtonLeft: null,
    ButtonRight: ScreenHeaderCloseButton,
  },
  minimal: {
    backgroundColor: Colors.BRAND_DARK_BLUE,
    textColor: Colors.WHITE,
    ButtonLeft: null,
    ButtonRight: null,
  },
};
