import {
  Attachments,
  NoteNamespaceEnum,
  OtherCategory,
  ServiceEnum,
  ServiceRequestTypeEnum,
  ViewNoteQuery,
} from '@monorepo/expo/betterangels';
import {
  ArrowTrendUpIcon,
  BlanketIcon,
  BookOpenIcon,
  BottleWaterIcon,
  BriefcaseMedicalIcon,
  BurgerSodaIcon,
  CarIcon,
  IIconProps,
  PaperclipIcon,
  PawIcon,
  PeopleRoofIcon,
  PlusIcon,
  ShirtIcon,
  ShowerIcon,
  SneakerIcon,
  SyringeIcon,
  TentIcon,
  ToothIcon,
  ToothbrushIcon,
  WarehouseIcon,
} from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  FieldCard,
  TextBold,
  TextMedium,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, SetStateAction, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import ProvidedCheckbox from './ProvidedCheckbox';

interface IProvidedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
  services: ViewNoteQuery['note']['providedServices'];
  attachments: ViewNoteQuery['note']['attachments'];
}

const ICONS: { [key in ServiceEnum]: React.ComponentType<IIconProps> } = {
  [ServiceEnum.Food]: BurgerSodaIcon,
  [ServiceEnum.Water]: BottleWaterIcon,
  [ServiceEnum.Blanket]: BlanketIcon,
  [ServiceEnum.Book]: BookOpenIcon,
  [ServiceEnum.Clothes]: ShirtIcon,
  [ServiceEnum.HygieneKit]: ToothbrushIcon,
  [ServiceEnum.PetFood]: PawIcon,
  [ServiceEnum.Shoes]: SneakerIcon,
  [ServiceEnum.Shower]: ShowerIcon,
  [ServiceEnum.Shelter]: PeopleRoofIcon,
  [ServiceEnum.Storage]: WarehouseIcon,
  [ServiceEnum.Transport]: CarIcon,
  [ServiceEnum.Dental]: ToothIcon,
  [ServiceEnum.HarmReduction]: SyringeIcon,
  [ServiceEnum.Medical]: BriefcaseMedicalIcon,
  [ServiceEnum.PetCare]: PawIcon,
  [ServiceEnum.Stabilize]: ArrowTrendUpIcon,
  [ServiceEnum.Bicycle]: CarIcon,
  [ServiceEnum.BirthCertificate]: ArrowTrendUpIcon,
  [ServiceEnum.CaliforniaLifelinePhone]: ArrowTrendUpIcon,
  [ServiceEnum.ContactDpss]: ArrowTrendUpIcon,
  [ServiceEnum.ContactFriend]: ArrowTrendUpIcon,
  [ServiceEnum.DiscountScooterRides]: ArrowTrendUpIcon,
  [ServiceEnum.DmhEvaluation]: ArrowTrendUpIcon,
  [ServiceEnum.DmvNoFeeIdForm]: ArrowTrendUpIcon,
  [ServiceEnum.FamilyReunification]: ArrowTrendUpIcon,
  [ServiceEnum.InternetAccess]: ArrowTrendUpIcon,
  [ServiceEnum.LegalCounsel]: ArrowTrendUpIcon,
  [ServiceEnum.MailPickUp]: ArrowTrendUpIcon,
  [ServiceEnum.MetroLifeTap]: ArrowTrendUpIcon,
  [ServiceEnum.Other]: PlusIcon,
  [ServiceEnum.PublicBenefitsPrograms]: ArrowTrendUpIcon,
  [ServiceEnum.Ride]: CarIcon,
  [ServiceEnum.SafeParking]: CarIcon,
  [ServiceEnum.SocialSecurityCardReplacement]: ArrowTrendUpIcon,
  [ServiceEnum.StimulusAssistance]: ArrowTrendUpIcon,
  [ServiceEnum.StorageBelongings]: WarehouseIcon,
  [ServiceEnum.StorageDocuments]: WarehouseIcon,
  [ServiceEnum.Tent]: TentIcon,
  [ServiceEnum.TherapistAppointment]: ArrowTrendUpIcon,
  [ServiceEnum.UnemploymentCertification]: ArrowTrendUpIcon,
  [ServiceEnum.VaccinePassport]: ArrowTrendUpIcon,
};

const SERVICES = [
  {
    title: 'Food and Water',
    items: [
      { Icon: BurgerSodaIcon, title: 'Food', enum: ServiceEnum.Food },
      { Icon: BottleWaterIcon, title: 'Water', enum: ServiceEnum.Water },
    ],
  },
  {
    title: 'Household Items',
    items: [
      { Icon: BlanketIcon, title: 'Blanket', enum: ServiceEnum.Blanket },
      { Icon: BookOpenIcon, title: 'Book', enum: ServiceEnum.Book },
      { Icon: ShirtIcon, title: 'Clothes', enum: ServiceEnum.Clothes },
      {
        Icon: ToothbrushIcon,
        title: 'Hygiene Kit',
        enum: ServiceEnum.HygieneKit,
      },
      { Icon: PawIcon, title: 'Pet Food', enum: ServiceEnum.PetFood },
      { Icon: SneakerIcon, title: 'Shoes', enum: ServiceEnum.Shoes },
      { Icon: ShowerIcon, title: 'Shower', enum: ServiceEnum.Shower },
    ],
  },
  {
    title: 'Living Essentials',
    items: [
      { Icon: CarIcon, title: 'Bicycle', enum: ServiceEnum.Bicycle },
      { Icon: PeopleRoofIcon, title: 'Shelter', enum: ServiceEnum.Shelter },
      {
        Icon: WarehouseIcon,
        title: 'Storage Belongings',
        enum: ServiceEnum.StorageBelongings,
      },
      {
        Icon: WarehouseIcon,
        title: 'Storage Documents',
        enum: ServiceEnum.StorageDocuments,
      },
      { Icon: TentIcon, title: 'Tent', enum: ServiceEnum.Tent },
      { Icon: CarIcon, title: 'Ride', enum: ServiceEnum.Ride },
      { Icon: CarIcon, title: 'Safe Parking', enum: ServiceEnum.SafeParking },
      {
        Icon: SyringeIcon,
        title: 'Therapist Appointment',
        enum: ServiceEnum.TherapistAppointment,
      },
    ],
  },
  {
    title: 'Medical Items',
    items: [
      { Icon: ToothIcon, title: 'Dental', enum: ServiceEnum.Dental },
      {
        Icon: SyringeIcon,
        title: 'Harm Reduction',
        enum: ServiceEnum.HarmReduction,
      },
      {
        Icon: BriefcaseMedicalIcon,
        title: 'Medical',
        enum: ServiceEnum.Medical,
      },
      { Icon: PawIcon, title: 'Pet Care', enum: ServiceEnum.PetCare },
    ],
  },
  {
    title: 'Other Items',
    items: [
      {
        Icon: ArrowTrendUpIcon,
        title: 'Birth Certificate',
        enum: ServiceEnum.BirthCertificate,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'California Lifeline Phone',
        enum: ServiceEnum.CaliforniaLifelinePhone,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Contact DPSS',
        enum: ServiceEnum.ContactDpss,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Contact Friend',
        enum: ServiceEnum.ContactFriend,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Discount Scooter Rides',
        enum: ServiceEnum.DiscountScooterRides,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'DMH Evaluation',
        enum: ServiceEnum.DmhEvaluation,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'DMV No Fee Id Form',
        enum: ServiceEnum.DmvNoFeeIdForm,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Family Reunification',
        enum: ServiceEnum.FamilyReunification,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Internet Access',
        enum: ServiceEnum.InternetAccess,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Legal Counsel',
        enum: ServiceEnum.LegalCounsel,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Mail Pick Up',
        enum: ServiceEnum.MailPickUp,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Metro Life Tap',
        enum: ServiceEnum.MetroLifeTap,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Public Benefits Programs',
        enum: ServiceEnum.PublicBenefitsPrograms,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Social Security Card Replacement',
        enum: ServiceEnum.SocialSecurityCardReplacement,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Stimulus Assistance',
        enum: ServiceEnum.StimulusAssistance,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Unemployment Certification',
        enum: ServiceEnum.UnemploymentCertification,
      },
      {
        Icon: ArrowTrendUpIcon,
        title: 'Vaccine Passport',
        enum: ServiceEnum.VaccinePassport,
      },
    ],
  },
];

export default function ProvidedServices(props: IProvidedServicesProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    services: initialServices,
    attachments,
    scrollRef,
  } = props;
  const [images, setImages] = useState<
    Array<{ id: string | undefined; uri: string }> | undefined
  >(undefined);
  const [services, setServices] = useState<
    | Array<{
        id: string | undefined;
        enum: ServiceEnum;
      }>
    | undefined
  >(undefined);

  const [serviceOthers, setServiceOthers] = useState<
    { title: string; id: string | undefined }[] | undefined
  >(undefined);

  const isProvidedServices = expanded === 'Provided Services';
  const isLessThanOneProvidedService =
    services &&
    services.length < 1 &&
    serviceOthers &&
    serviceOthers.length < 1;
  const isLessThanOneProvidedServiceImages = images && images.length < 1;
  const isGreaterThanZeroProvidedService =
    (services && services.length > 0) ||
    (serviceOthers && serviceOthers.length > 0);
  const isGreaterThanZeroProvidedServiceImages = images && images?.length > 0;

  useEffect(() => {
    if (initialServices.length === 0) {
      setServices([]);
      setServiceOthers([]);
      return;
    }
    const newServices: SetStateAction<
      { id: string | undefined; enum: ServiceEnum }[] | undefined
    > = [];
    const newServiceOthers: SetStateAction<
      { title: string; id: string | undefined }[] | undefined
    > = [];

    initialServices.forEach((service) => {
      if (service.service === 'OTHER') {
        newServiceOthers.push({
          id: service.id,
          title: service.serviceOther || '',
        });
      } else {
        newServices.push({
          id: service.id,
          enum: service.service,
        });
      }
    });

    if (newServices.length > 0 || services?.length !== newServices.length) {
      setServices(newServices);
    }

    if (
      newServiceOthers.length > 0 ||
      serviceOthers?.length !== newServiceOthers.length
    ) {
      setServiceOthers(newServiceOthers);
    }
  }, [initialServices]);

  useEffect(() => {
    if (attachments.length === 0) {
      setImages([]);
      return;
    }
    const newImages = attachments.map((attachment) => ({
      id: attachment.id,
      uri: attachment.file.url,
    }));
    setImages(newImages);
  }, [attachments]);

  if (!services || !serviceOthers || !images) return null;

  return (
    <FieldCard
      scrollRef={scrollRef}
      childHeight={isProvidedServices ? 'auto' : 0}
      actionName={
        isProvidedServices &&
        isLessThanOneProvidedService &&
        isLessThanOneProvidedServiceImages ? (
          ''
        ) : isGreaterThanZeroProvidedService ||
          isGreaterThanZeroProvidedServiceImages ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacings.xxs,
            }}
          >
            {services &&
              services.map((item, index) => {
                const IconComponent = ICONS[item.enum];
                return (
                  <IconComponent
                    mr="xs"
                    key={index}
                    size="md"
                    color={Colors.PRIMARY_EXTRA_DARK}
                  />
                );
              })}

            {serviceOthers && serviceOthers.length > 0 && (
              <PlusIcon mr="xs" size="md" key="plusIcon" />
            )}
            {isGreaterThanZeroProvidedServiceImages && (
              <PaperclipIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
            )}
          </View>
        ) : (
          <TextMedium size="sm">Add Services</TextMedium>
        )
      }
      mb="xs"
      title="Provided Services"
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isProvidedServices ? null : 'Provided Services');
      }}
    >
      <View>
        {SERVICES.map((service, idx) => (
          <View
            style={{ marginTop: idx !== 0 ? Spacings.xs : 0 }}
            key={service.title}
          >
            <TextBold mb="xs">{service.title}</TextBold>
            {service.items.map((item, idx) => {
              const serviceId = services?.find((s) => s.enum === item.enum)?.id;
              return (
                <ProvidedCheckbox
                  key={item.enum}
                  services={services}
                  setServices={setServices}
                  noteId={noteId}
                  id={serviceId}
                  service={item}
                  idx={idx}
                />
              );
            })}
          </View>
        ))}
        <OtherCategory
          noteId={noteId}
          setServices={setServiceOthers}
          serviceType={ServiceRequestTypeEnum.Provided}
          services={serviceOthers}
        />
        <Attachments
          noteId={noteId}
          namespace={NoteNamespaceEnum.ProvidedServices}
          images={images}
          setImages={setImages}
        />
      </View>
    </FieldCard>
  );
}
