export type TPresentationType =
  | 'modal'
  | 'transparentModal'
  | 'fullScreenModal'
  | 'card';

export interface IModalScreenContext {
  closeModalScreen: () => void;
  showModalScreen: (
    component: React.ReactNode,
    presentation?: TPresentationType
  ) => void;
  modalContent: React.ReactNode | null;
  presentation: TPresentationType;
  clearModalScreen: () => void;
}
