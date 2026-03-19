export type TToastStatus = 'success' | 'error' | 'warning' | 'info';

export interface IToastAction {
  label: string;
  onClick: () => void;
}

export interface IToastProps {
  status: TToastStatus;
  title: string;
  description?: string;
  action?: IToastAction;
  onClose: () => void;
}

export interface IToastAtomProps {
  id: string;
  visible: boolean;
  status: TToastStatus;
  title: string;
  description?: string;
  action?: IToastAction;
}
