import { ReactNode } from 'react';

export type TModalPresentationType = 'modal' | 'card' | 'fullScreenModal';

export type TShowModalScreenProps = {
  content: ReactNode;
  presentation?: TModalPresentationType;
  title?: string;
  hideHeader?: boolean;
  onClose?: null | (() => void);
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  closeModalScreen: () => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
}
