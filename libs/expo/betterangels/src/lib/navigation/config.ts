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
 * What each header variant is made of. The single definition both header
 * implementations read — the in-app `ScreenHeader` renders it directly, native
 * headers project it through `getNativeHeaderOptions`.
 *
 * `none` has no entry: there is nothing to describe.
 */
export const headerVariants: Record<
  Exclude<THeaderVariant, 'none'>,
  THeaderVariantConfig
> = {
  default: {
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
