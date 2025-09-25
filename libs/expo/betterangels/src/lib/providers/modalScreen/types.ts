import { ReactNode } from 'react';

export type noOpFn = () => void;

export type TModalPresentationType = 'modal' | 'card' | 'fullScreenModal';

export type TShowModalScreenProps = {
  content: ReactNode | (() => ReactNode);
  presentation?: TModalPresentationType;
  title?: string;
  hideHeader?: boolean;
  onClose?: null | noOpFn;
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  closeModalScreen: () => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
}
