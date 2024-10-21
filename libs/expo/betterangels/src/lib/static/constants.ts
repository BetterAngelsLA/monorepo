import { ServiceEnum } from '../apollo';
import { enumDisplayServices } from './enumDisplayMapping';

export const Services = [
  {
    title: 'Immediate Needs',
    items: [
      { title: enumDisplayServices[ServiceEnum.Food], enum: ServiceEnum.Food },
      {
        title: enumDisplayServices[ServiceEnum.Water],
        enum: ServiceEnum.Water,
      },
      {
        title: enumDisplayServices[ServiceEnum.Blanket],
        enum: ServiceEnum.Blanket,
      },
      { title: enumDisplayServices[ServiceEnum.Book], enum: ServiceEnum.Book },
      {
        title: enumDisplayServices[ServiceEnum.Clothes],
        enum: ServiceEnum.Clothes,
      },
      {
        title: enumDisplayServices[ServiceEnum.HygieneKit],
        enum: ServiceEnum.HygieneKit,
      },
      {
        title: enumDisplayServices[ServiceEnum.PetFood],
        enum: ServiceEnum.PetFood,
      },
      {
        title: enumDisplayServices[ServiceEnum.Shoes],
        enum: ServiceEnum.Shoes,
      },
      {
        title: enumDisplayServices[ServiceEnum.Shower],
        enum: ServiceEnum.Shower,
      },
      { title: enumDisplayServices[ServiceEnum.Tent], enum: ServiceEnum.Tent },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.MailPickUp],
        enum: ServiceEnum.MailPickUp,
      },

      {
        title: enumDisplayServices[ServiceEnum.CaliforniaLifelinePhone],
        enum: ServiceEnum.CaliforniaLifelinePhone,
      },

      {
        title: enumDisplayServices[ServiceEnum.InternetAccess],
        enum: ServiceEnum.InternetAccess,
      },
    ],
  },
  {
    title: 'Identity',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.BirthCertificate],
        enum: ServiceEnum.BirthCertificate,
      },
      {
        title: enumDisplayServices[ServiceEnum.DmvNoFeeIdForm],
        enum: ServiceEnum.DmvNoFeeIdForm,
      },
      {
        title: enumDisplayServices[ServiceEnum.SocialSecurityCardReplacement],
        enum: ServiceEnum.SocialSecurityCardReplacement,
      },
    ],
  },
  {
    title: 'Income',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.StimulusAssistance],
        enum: ServiceEnum.StimulusAssistance,
      },
      {
        title: enumDisplayServices[ServiceEnum.PublicBenefitsPrograms],
        enum: ServiceEnum.PublicBenefitsPrograms,
      },
      {
        title: enumDisplayServices[ServiceEnum.UnemploymentCertification],
        enum: ServiceEnum.UnemploymentCertification,
      },
    ],
  },
  {
    title: 'Housing',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.Shelter],
        enum: ServiceEnum.Shelter,
      },
      {
        title: enumDisplayServices[ServiceEnum.StorageDocuments],
        enum: ServiceEnum.StorageDocuments,
      },
      {
        title: enumDisplayServices[ServiceEnum.StorageBelongings],
        enum: ServiceEnum.StorageBelongings,
      },
      {
        title: enumDisplayServices[ServiceEnum.SafeParking],
        enum: ServiceEnum.SafeParking,
      },
    ],
  },
  {
    title: 'Medical',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.Dental],
        enum: ServiceEnum.Dental,
      },
      {
        title: enumDisplayServices[ServiceEnum.HarmReduction],
        enum: ServiceEnum.HarmReduction,
      },
      {
        title: enumDisplayServices[ServiceEnum.Medical],
        enum: ServiceEnum.Medical,
      },
      {
        title: enumDisplayServices[ServiceEnum.PetCare],
        enum: ServiceEnum.PetCare,
      },
      {
        title: enumDisplayServices[ServiceEnum.VaccinePassport],
        enum: ServiceEnum.VaccinePassport,
      },
    ],
  },
  {
    title: 'Mental',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.DmhEvaluation],
        enum: ServiceEnum.DmhEvaluation,
      },
      {
        title: enumDisplayServices[ServiceEnum.TherapistAppointment],
        enum: ServiceEnum.TherapistAppointment,
      },
    ],
  },
  {
    title: 'Social',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.FamilyReunification],
        enum: ServiceEnum.FamilyReunification,
      },
      {
        title: enumDisplayServices[ServiceEnum.ContactFriend],
        enum: ServiceEnum.ContactFriend,
      },
    ],
  },
  {
    title: 'Transportation',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.MetroLifeTap],
        enum: ServiceEnum.MetroLifeTap,
      },
      {
        title: enumDisplayServices[ServiceEnum.DiscountScooterRides],
        enum: ServiceEnum.DiscountScooterRides,
      },
      { title: enumDisplayServices[ServiceEnum.Ride], enum: ServiceEnum.Ride },
      {
        title: enumDisplayServices[ServiceEnum.Bicycle],
        enum: ServiceEnum.Bicycle,
      },
    ],
  },
  {
    title: 'Legal',
    items: [
      {
        title: enumDisplayServices[ServiceEnum.ContactDpss],
        enum: ServiceEnum.ContactDpss,
      },
      {
        title: enumDisplayServices[ServiceEnum.LegalCounsel],
        enum: ServiceEnum.LegalCounsel,
      },
    ],
  },
];
