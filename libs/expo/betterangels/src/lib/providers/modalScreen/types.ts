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
  onClose?: null | noOpFn;
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
}

export type IModalScreenState = {
  presentation: TModalPresentationType;
  title: string;
  hideHeader: boolean;
  renderContent: ((api: TRenderContentApi) => ReactNode) | null;
};
