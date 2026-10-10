import { ReactNode } from 'react';
import {
  ClientProfileSectionEnum,
  TStandardSection,
} from '../../../screenRouting';
import ContactInfoForm from './ContactInfoForm';
import DemographicInfoForm from './DemographicInfoForm';
import FullNameForm from './FullnameForm';
import ImportantNotesForm from './ImportantNotesForm';
import PersonalInfoForm from './PersonalInfoForm';

export const config: Record<
  TStandardSection,
  { title: string; content: ReactNode }
> = {
  [ClientProfileSectionEnum.ContactInfo]: {
    title: 'Edit Contact Information',
    content: <ContactInfoForm />,
  },
  [ClientProfileSectionEnum.Demographic]: {
    title: 'Edit Demographic Info',
    content: <DemographicInfoForm />,
  },
  [ClientProfileSectionEnum.FullName]: {
    title: 'Edit Full Name',
    content: <FullNameForm />,
  },
  [ClientProfileSectionEnum.ImportantNotes]: {
    title: 'Edit Important Notes',
    content: <ImportantNotesForm />,
  },
  [ClientProfileSectionEnum.PersonalInfo]: {
    title: 'Edit Personal Info',
    content: <PersonalInfoForm />,
  },
};
