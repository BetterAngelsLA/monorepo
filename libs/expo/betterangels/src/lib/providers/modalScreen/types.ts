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
 * `getStackModalOptions`, the in-app bar via the `modal-screen` route.
 */
export type TModalHeaderConfig = {
  /**
   * Which header this modal gets. Defaults to `'native'` — the platform bar.
   * `'custom'` draws the in-app `ScreenHeader` instead; `'none'` draws no bar
   * at all.
   */
  mode?: THeaderMode;
  /**
   * Which palette from `headerStyles` the bar uses. Applies to both native
   * and custom headers; defaults to the presentation's palette (`card` →
   * primary, modal presentations → secondary).
   */
  variant?: THeaderVariant;
  /** Label for the default close button (e.g. "Done"). Read by the native
   *  right slot and the custom `ScreenHeader`'s close button alike. */
  closeLabel?: string;
  /** Custom-header left slot. Omit (or pass `null`) for none; pass a node for
   *  custom content. */
  buttonLeft?: ReactNode | null;
  /** Custom-header right slot. Replaces the default close button; pass `null`
   *  for a surface that must not be dismissed from the bar. */
  buttonRight?: ReactNode | null;
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
