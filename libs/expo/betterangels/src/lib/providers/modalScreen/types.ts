import { ReactNode } from 'react';

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
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
  /** If set, renders a text button instead of the "×" icon in the header. */
  headerCloseLabel?: string;
}

export type IModalScreenState = {
  presentation: TModalPresentationType;
  title: string;
  hideHeader: boolean;
  renderContent: ((api: TRenderContentApi) => ReactNode) | null;
  headerCloseLabel?: string;
};
