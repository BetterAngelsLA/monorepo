import { ReactNode } from 'react';

export interface ISectionProps {
  setTab: (tab: ITab) => void;
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  children: ReactNode;
}

export type ITab =
  | 'dl'
  | 'bc'
  | 'photoId'
  | 'ssn'
  | 'consentForms'
  | 'hmis'
  | 'incomeForms'
  | undefined;
