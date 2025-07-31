import { ReactNode } from 'react';

export type TAlertType = 'success' | 'error';

export type TAlertAtomProps = {
  visible: boolean;
  content: ReactNode;
  type: TAlertType;
};

export type TAlertConfig = {
  color: string;
  icon?: ReactNode;
};
