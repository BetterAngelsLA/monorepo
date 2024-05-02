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
  ShoePrintsIcon,
  ShowerIcon,
  SyringeIcon,
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
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import RequestedCheckbox from './RequestedCheckbox';

interface IRequestedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  services: ViewNoteQuery['note']['requestedServices'];
  attachments: ViewNoteQuery['note']['attachments'];
}

const ICONS: { [key: string]: React.ComponentType<IIconProps> } = {
  FOOD: BurgerSodaIcon,
  WATER: BottleWaterIcon,
  BLANKET: BlanketIcon,
  BOOK: BookOpenIcon,
  CLOTHES: ShirtIcon,
  HYGIENE_KIT: ToothbrushIcon,
  PET_FOOD: PawIcon,
  SHOES: ShoePrintsIcon,
  SHOWER: ShowerIcon,
  SHELTER: PeopleRoofIcon,
  STORAGE: WarehouseIcon,
  TRANSPORT: CarIcon,
  DENTAL: ToothIcon,
  HARM_REDUCTION: SyringeIcon,
  MEDICAL: BriefcaseMedicalIcon,
  PET_CARE: PawIcon,
  STABILIZE: ArrowTrendUpIcon,
  Other: PlusIcon,
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
      { Icon: ShoePrintsIcon, title: 'Shoes', enum: ServiceEnum.Shoes },
      { Icon: ShowerIcon, title: 'Shower', enum: ServiceEnum.Shower },
    ],
  },
  {
    title: 'Living Essentials',
    items: [
      { Icon: PeopleRoofIcon, title: 'Shelter', enum: ServiceEnum.Shelter },
      { Icon: WarehouseIcon, title: 'Storage', enum: ServiceEnum.Storage },
      { Icon: CarIcon, title: 'Transport', enum: ServiceEnum.Transport },
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
        title: 'Stabilize',
        enum: ServiceEnum.Stabilize,
      },
    ],
  },
];

export default function RequestedServices(props: IRequestedServicesProps) {
  const {
    expanded,
    setExpanded,
    noteId,
    services: initialServices,
    attachments,
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
  const [customServices, setCustomServices] = useState<
    { title: string; id: string | undefined }[] | undefined
  >(undefined);

  const isRequestedServices = expanded === 'Requested Services';
  const isLessThanOneRequestedService =
    services &&
    services.length < 1 &&
    customServices &&
    customServices.length < 1;
  const isLessThanOneRequestedServiceImages = images && images.length < 1;
  const isGreaterThanZeroRequestedService =
    (services && services.length > 0) ||
    (customServices && customServices.length > 0);
  const isGreaterThanZeroRequestedServiceImages = images && images?.length > 0;

  useEffect(() => {
    if (initialServices.length === 0) {
      setServices([]);
      setCustomServices([]);
      return;
    }
    const newServices:
      | { id: string | undefined; enum: ServiceEnum }[]
      | undefined = [];
    const newCustomServices:
      | { title: string; id: string | undefined }[]
      | undefined = [];

    initialServices.forEach((service) => {
      if (service.service === 'OTHER') {
        newCustomServices.push({
          id: service.id,
          title: service.customService || '',
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
      newCustomServices.length > 0 ||
      customServices?.length !== newCustomServices.length
    ) {
      setCustomServices(newCustomServices);
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

  if (!services || !customServices || !images) return null;

  return (
    <FieldCard
      childHeight={isRequestedServices ? 'auto' : 0}
      actionName={
        isRequestedServices &&
        isLessThanOneRequestedService &&
        isLessThanOneRequestedServiceImages ? (
          ''
        ) : isGreaterThanZeroRequestedService ||
          isGreaterThanZeroRequestedServiceImages ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {services.map((item, index) => {
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

            {customServices.length > 0 && (
              <PlusIcon
                mr="xs"
                size="md"
                color={Colors.PRIMARY_EXTRA_DARK}
                key="plusIcon"
              />
            )}
            {isGreaterThanZeroRequestedServiceImages && (
              <PaperclipIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
            )}
          </View>
        ) : (
          <TextMedium size="sm">Add Services</TextMedium>
        )
      }
      mb="xs"
      title="Requested Services"
      expanded={expanded}
      setExpanded={() =>
        setExpanded(isRequestedServices ? null : 'Requested Services')
      }
    >
      <View style={{ paddingBottom: Spacings.md }}>
        {SERVICES.map((service, idx) => (
          <View
            style={{ marginTop: idx !== 0 ? Spacings.xs : 0 }}
            key={service.title}
          >
            <TextBold mb="xs">{service.title}</TextBold>
            {service.items.map((item, idx) => {
              const serviceId = services.find((s) => s.enum === item.enum)?.id;
              return (
                <RequestedCheckbox
                  key={item.enum}
                  services={services}
                  setServices={setServices}
                  id={serviceId}
                  noteId={noteId}
                  service={item}
                  idx={idx}
                />
              );
            })}
          </View>
        ))}
        <OtherCategory
          noteId={noteId}
          setServices={setCustomServices}
          serviceType={ServiceRequestTypeEnum.Requested}
          services={customServices}
        />

        <Attachments
          noteId={noteId}
          namespace={NoteNamespaceEnum.RequestedServices}
          images={images}
          setImages={setImages}
        />
      </View>
    </FieldCard>
  );
}
