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

const ICONS: { [key: string]: React.ComponentType<IIconProps> } = {
  FOOD: BurgerSodaIcon,
  WATER: BottleWaterIcon,
  BLANKET: BlanketIcon,
  BOOK: BookOpenIcon,
  CLOTHES: ShirtIcon,
  HYGIENE_KIT: ToothbrushIcon,
  PET_FOOD: PawIcon,
  SHOES: SneakerIcon,
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
      { Icon: SneakerIcon, title: 'Shoes', enum: ServiceEnum.Shoes },
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

  const [customServices, setCustomServices] = useState<
    { title: string; id: string | undefined }[] | undefined
  >(undefined);

  const isProvidedServices = expanded === 'Provided Services';
  const isLessThanOneProvidedService =
    services &&
    services.length < 1 &&
    customServices &&
    customServices.length < 1;
  const isLessThanOneProvidedServiceImages = images && images.length < 1;
  const isGreaterThanZeroProvidedService =
    (services && services.length > 0) ||
    (customServices && customServices.length > 0);
  const isGreaterThanZeroProvidedServiceImages = images && images?.length > 0;

  useEffect(() => {
    if (initialServices.length === 0) {
      setServices([]);
      setCustomServices([]);
      return;
    }
    const newServices: SetStateAction<
      { id: string | undefined; enum: ServiceEnum }[] | undefined
    > = [];
    const newCustomServices: SetStateAction<
      { title: string; id: string | undefined }[] | undefined
    > = [];

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

            {customServices && customServices.length > 0 && (
              <PlusIcon
                mr="xs"
                size="md"
                color={Colors.PRIMARY_EXTRA_DARK}
                key="plusIcon"
              />
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
          setServices={setCustomServices}
          serviceType={ServiceRequestTypeEnum.Provided}
          services={customServices}
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
