import {
  Attachments,
  NoteNamespaceEnum,
  OtherCategory,
  ServiceEnum,
  ServiceRequestTypeEnum,
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
import { RefObject, useState } from 'react';
import { ScrollView, View } from 'react-native';
import RequestedCheckbox from './RequestedCheckbox';

interface IRequestedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  noteId: string | undefined;
  scrollRef: RefObject<ScrollView>;
}

const ICONS: { [key: string]: React.ComponentType<IIconProps> } = {
  Food: BurgerSodaIcon,
  Water: BottleWaterIcon,
  Blanket: BlanketIcon,
  Book: BookOpenIcon,
  Clothes: ShirtIcon,
  'Hygiene Kit': ToothbrushIcon,
  'Pet Food': PawIcon,
  Shoes: ShoePrintsIcon,
  Shower: ShowerIcon,
  Shelter: PeopleRoofIcon,
  Storage: WarehouseIcon,
  Transport: CarIcon,
  Dental: ToothIcon,
  'Harm Reduction': SyringeIcon,
  Medical: BriefcaseMedicalIcon,
  'Pet Care': PawIcon,
  Stabilize: ArrowTrendUpIcon,
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
  const { expanded, setExpanded, noteId, scrollRef } = props;
  const [images, setImages] = useState<
    Array<{ id: string | undefined; uri: string }>
  >([]);
  const [services, setServices] = useState<
    Array<{
      id: string | undefined;
      service: string;
      enum: ServiceEnum;
    }>
  >([]);
  const [customServices, setCustomServices] = useState<
    { title: string; id: string | undefined }[]
  >([]);

  const isRequestedServices = expanded === 'Requested Services';
  const isLessThanOneRequestedService =
    services.length < 1 && customServices.length < 1;
  const isLessThanOneRequestedServiceImages = images.length < 1;
  const isGreaterThanZeroRequestedService =
    services.length > 0 || customServices.length > 0;
  const isGreaterThanZeroRequestedServiceImages = images?.length > 0;

  return (
    <FieldCard
      scrollRef={scrollRef}
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
              const IconComponent = ICONS[item.service];
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
            {service.items.map((item, idx) => (
              <RequestedCheckbox
                key={item.enum}
                services={services}
                setServices={setServices}
                noteId={noteId}
                service={item}
                idx={idx}
              />
            ))}
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
