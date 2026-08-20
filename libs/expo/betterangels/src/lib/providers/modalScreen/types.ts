import { ReactNode } from 'react';
import { THeaderVariant } from '../../navigation/types';

export type noOpFn = () => void;

export type TModalPresentationType = 'modal' | 'card' | 'fullScreenModal';

export type TRenderContentApi = {
  close: () => void;
};

export type TShowModalScreenProps = {
  renderContent: (api: TRenderContentApi) => ReactNode;
  presentation?: TModalPresentationType;
  title?: string;
  hideHeader?: boolean;
  /** Fires when the modal is dismissed (pathname changes away). */
  onClose?: null | noOpFn;
  /** Replaces the default "×" icon with a text label (e.g. "Done"). */
  headerCloseLabel?: string;
  /**
   * Renders the in-app `ScreenHeader` in this variant. Opt-in: without it no
   * in-app header is drawn. Pair it with `hideHeader: true`, which turns the
   * native header off — otherwise the screen gets both.
   */
  headerVariant?: THeaderVariant;
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
  /** If set, renders a text button instead of the "×" icon in the header. */
  headerCloseLabel?: string;
  headerVariant?: THeaderVariant;
}

export type IModalScreenState = {
  presentation: TModalPresentationType;
  title: string;
  hideHeader: boolean;
  renderContent: ((api: TRenderContentApi) => ReactNode) | null;
  headerCloseLabel?: string;
  headerVariant?: THeaderVariant;
};
