import { ReactNode } from 'react';
import { THeaderMode, THeaderVariant } from '../../navigation/types';

export type noOpFn = () => void;

export type TModalPresentationType = 'modal' | 'card' | 'fullScreenModal';

export type TRenderContentApi = {
  close: () => void;
};

/**
 * The modal's header, as one unit. `mode` picks which header renders; the rest
 * configure it. Both header renderers read the same object — the native bar via
 * `getDefaultStackModalOptions`, the in-app bar via the `modal-screen` route.
 */
export type TModalHeaderConfig = {
  /**
   * Which header this modal gets. Defaults to `'native'` — the platform bar.
   * `'custom'` draws the in-app `ScreenHeader` instead (styled by `variant`);
   * `'none'` draws no bar at all.
   */
  mode?: THeaderMode;
  /** Which style from `headerVariants`. Only used when `mode` is `'custom'`. */
  variant?: THeaderVariant;
  /** Left slot. Same tri-state as `ScreenHeader`'s `buttonLeft`: omit for the
   *  variant's default, `null` for no button, a node for custom content. */
  buttonLeft?: ReactNode | null;
  /** Replaces the default "×" icon with a text label (e.g. "Done"). */
  closeLabel?: string;
  /** Draws the close button in a `'custom'` header. Defaults to `true`; pass
   *  `false` for a surface that must not be dismissed from the bar. */
  closeButton?: boolean;
};

export type TShowModalScreenProps = {
  renderContent: (api: TRenderContentApi) => ReactNode;
  presentation?: TModalPresentationType;
  title?: string;
  /** Fires when the modal is dismissed (pathname changes away). */
  onClose?: null | noOpFn;
  /** Header configuration. Defaults to a `'native'` header. */
  header?: TModalHeaderConfig;
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  title?: string;
  header?: TModalHeaderConfig;
}

export type IModalScreenState = {
  presentation: TModalPresentationType;
  title: string;
  renderContent: ((api: TRenderContentApi) => ReactNode) | null;
  header?: TModalHeaderConfig;
};
