import { ServiceEnum } from '../apollo';

export const ServicesByCategory = [
  {
    title: 'Immediate Needs',
    items: [
      ServiceEnum.Food,
      ServiceEnum.Water,
      ServiceEnum.Blanket,
      ServiceEnum.Book,
      ServiceEnum.Clothes,
      ServiceEnum.HygieneKit,
      ServiceEnum.PetFood,
      ServiceEnum.Shoes,
      ServiceEnum.Shower,
      ServiceEnum.Tent,
    ],
  },
  {
    title: 'Communication',
    items: [
      ServiceEnum.MailPickUp,
      ServiceEnum.CaliforniaLifelinePhone,
      ServiceEnum.InternetAccess,
    ],
  },
  {
    title: 'Identity',
    items: [
      ServiceEnum.BirthCertificate,
      ServiceEnum.DmvNoFeeIdForm,
      ServiceEnum.SocialSecurityCardReplacement,
    ],
  },
  {
    title: 'Income',
    items: [
      ServiceEnum.StimulusAssistance,
      ServiceEnum.PublicBenefitsPrograms,
      ServiceEnum.UnemploymentCertification,
    ],
  },
  {
    title: 'Housing',
    items: [
      ServiceEnum.Shelter,
      ServiceEnum.StorageDocuments,
      ServiceEnum.StorageBelongings,
      ServiceEnum.SafeParking,
    ],
  },
  {
    title: 'Medical',
    items: [
      ServiceEnum.Dental,
      ServiceEnum.HarmReduction,
      ServiceEnum.Medical,
      ServiceEnum.PetCare,
      ServiceEnum.VaccinePassport,
    ],
  },
  {
    title: 'Mental',
    items: [ServiceEnum.DmhEvaluation, ServiceEnum.TherapistAppointment],
  },
  {
    title: 'Social',
    items: [ServiceEnum.FamilyReunification, ServiceEnum.ContactFriend],
  },
  {
    title: 'Transportation',
    items: [
      ServiceEnum.MetroLifeTap,
      ServiceEnum.DiscountScooterRides,
      ServiceEnum.Ride,
      ServiceEnum.Bicycle,
    ],
  },
  {
    title: 'Legal',
    items: [ServiceEnum.ContactDpss, ServiceEnum.LegalCounsel],
  },
];
