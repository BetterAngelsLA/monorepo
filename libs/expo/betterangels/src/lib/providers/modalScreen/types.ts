import { ReactNode } from 'react';

export type TModalPresentationType = 'modal' | 'card';

export type TShowModalScreenProps = {
  content: ReactNode;
  presentation?: TModalPresentationType;
  title?: string;
  hideHeader?: boolean;
  onClose?: () => void;
};
export interface IModalScreenContext {
  showModalScreen: (props: TShowModalScreenProps) => void;
  closeModalScreen: () => void;
  content: ReactNode | null;
  presentation: TModalPresentationType;
  hideHeader?: boolean;
  title?: string;
}
