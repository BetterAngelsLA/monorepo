import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { ClientProfileQuery } from '../../__generated__/Client.generated';

export interface IUploadSectionProps {
  onCancel: () => void;
  title: string;
  subtitle?: string;
  onSubmit: () => void;
  children: ReactNode;
  loading?: boolean;
}

export interface IUploadModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  opacity?: number;
  client: ClientProfileQuery | undefined;
}

export interface IIdDocUploadsProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  docType:
    | 'DriversLicenseFront'
    | 'DriversLicenseBack'
    | 'SocialSecurityCard'
    | 'PhotoId';
}

export interface IMultipleDocUploadsProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  docType: 'ConsentForm' | 'HmisForm' | 'IncomeForm' | 'OtherClientDocument';
}

export interface ISingleDocUploadsProps {
  setTab: (tab: ITab) => void;
  client: ClientProfileQuery | undefined;
  docs: Docs;
  setDocs: Dispatch<SetStateAction<Docs>>;
  title: string;
  docType:
    | 'DriversLicenseFront'
    | 'DriversLicenseBack'
    | 'BirthCertificate'
    | 'SocialSecurityCard'
    | 'PhotoId';
  thumbnailSize: TThumbnailSize;
}

export type TThumbnailSize = {
  height: number;
  width: number;
};

export type Docs = {
  DriversLicenseFront: ReactNativeFile | undefined;
  DriversLicenseBack: ReactNativeFile | undefined;
  BirthCertificate: ReactNativeFile | undefined;
  PhotoId: ReactNativeFile | undefined;
  SocialSecurityCard: ReactNativeFile | undefined;
  ConsentForm?: ReactNativeFile[];
  HmisForm?: ReactNativeFile[];
  IncomeForm?: ReactNativeFile[];
  OtherClientDocument?: ReactNativeFile[];
};

export type ITab =
  | 'DriversLicenseFront'
  | 'DriversLicenseBack'
  | 'BirthCertificate'
  | 'PhotoId'
  | 'SocialSecurityCard'
  | 'ConsentForm'
  | 'HmisForm'
  | 'IncomeForm'
  | 'OtherClientDocument'
  | undefined;
