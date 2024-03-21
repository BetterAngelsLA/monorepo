import { useMutation } from '@apollo/client';
import {
  Attachments,
  CREATE_SERVICE,
  DELETE_SERVICE,
  OtherCategory,
  UPDATE_NOTE,
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
  BodyText,
  Checkbox,
  FieldCard,
  H3,
  H5,
} from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface IRequestedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  noteId: string | undefined;
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
      { Icon: BurgerSodaIcon, title: 'Food' },
      { Icon: BottleWaterIcon, title: 'Water' },
    ],
  },
  {
    title: 'Household Items',
    items: [
      { Icon: BlanketIcon, title: 'Blanket' },
      { Icon: BookOpenIcon, title: 'Book' },
      { Icon: ShirtIcon, title: 'Clothes' },
      { Icon: ToothbrushIcon, title: 'Hygiene Kit' },
      { Icon: PawIcon, title: 'Pet Food' },
      { Icon: ShoePrintsIcon, title: 'Shoes' },
      { Icon: ShowerIcon, title: 'Shower' },
    ],
  },
  {
    title: 'Living Essentials',
    items: [
      { Icon: PeopleRoofIcon, title: 'Shelter' },
      { Icon: WarehouseIcon, title: 'Storage' },
      { Icon: CarIcon, title: 'Transport' },
    ],
  },
  {
    title: 'Medical Items',
    items: [
      { Icon: ToothIcon, title: 'Dental' },
      { Icon: SyringeIcon, title: 'Harm Reduction' },
      { Icon: BriefcaseMedicalIcon, title: 'Medical' },
      { Icon: PawIcon, title: 'Pet Care' },
    ],
  },
  {
    title: 'Other Items',
    items: [{ Icon: ArrowTrendUpIcon, title: 'Stabilize' }],
  },
];

export default function RequestedServices(props: IRequestedServicesProps) {
  const { expanded, setExpanded, noteId } = props;
  const { setValue, watch } = useFormContext();
  const [services, setServices] = useState<
    Array<{
      id: string | undefined;
      service: string | undefined;
      status: string;
      customService: string;
    }>
  >([]);
  const [createServiceRequest] = useMutation(CREATE_SERVICE);
  const [updateNote] = useMutation(UPDATE_NOTE);
  const [deleteServiceRequest] = useMutation(DELETE_SERVICE);
  const requestedServicesImages = watch('requestedServicesImages', []);
  const requestedServices = watch('requestedServices') || [];
  const isRequestedServices = expanded === 'Requested Services';
  const isLessThanOneRequestedService = services.length < 1;
  const isLessThanOneRequestedServiceImages =
    requestedServicesImages.length < 1;
  const isGreaterThanZeroRequestedService = services.length > 0;
  const isGreaterThanZeroRequestedServiceImages =
    requestedServicesImages?.length > 0;

  const toggleServices = async (service: string, isCustom: boolean) => {
    try {
      if (
        isCustom
          ? services.map((s) => s.customService).includes(service)
          : services.map((s) => s.service).includes(service)
      ) {
        const id = isCustom
          ? services.find((s) => s.customService === service)?.id
          : services.find((s) => s.service === service)?.id;
        await deleteServiceRequest({
          variables: {
            data: {
              id,
            },
          },
        });

        const newServices = services.filter((s) => s.id !== id);
        setServices(newServices);
        const ids = newServices.map((s) => s.id);
        setValue('requestedServices', ids);
      } else {
        const { data } = await createServiceRequest({
          variables: {
            data: {
              service: isCustom ? 'OTHER' : service.toUpperCase(),
              status: 'TO_DO',
              customService: isCustom ? service : '',
            },
          },
        });
        await updateNote({
          variables: {
            data: {
              id: noteId,
              requestedServices: [
                ...requestedServices,
                data?.createServiceRequest.id,
              ],
            },
          },
        });
        const newServices = [
          ...services,
          {
            id: data?.createServiceRequest.id,
            service: isCustom ? 'OTHER' : service,
            status: 'TO_DO',
            customService: isCustom ? service : '',
          },
        ];

        setServices(newServices);
        const ids = newServices.map((s) => s.id);
        setValue('requestedServices', ids);
      }
    } catch (e) {
      console.log('TOOGLE CHECKBOX ERROR: ', e);
    }
  };

  return (
    <FieldCard
      actionName={
        isRequestedServices &&
        isLessThanOneRequestedService &&
        isLessThanOneRequestedServiceImages ? (
          ''
        ) : isGreaterThanZeroRequestedService ||
          isGreaterThanZeroRequestedServiceImages ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {services.map((item, index) => {
              if (!item.customService && item.service && ICONS[item.service]) {
                const IconComponent = ICONS[item.service];
                return (
                  <IconComponent
                    mr="xs"
                    key={index}
                    size="md"
                    color={Colors.PRIMARY_EXTRA_DARK}
                  />
                );
              }
              return null;
            })}

            {services.some((item) => !item.service || item.customService) && (
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
          <H5 size="sm">Add Services</H5>
        )
      }
      mb="xs"
      title="Requested Services"
      expanded={expanded}
      setExpanded={() =>
        setExpanded(isRequestedServices ? null : 'Requested Services')
      }
    >
      {isRequestedServices && (
        <View style={{ paddingBottom: Spacings.md }}>
          {SERVICES.map((service, idx) => (
            <View
              style={{ marginTop: idx !== 0 ? Spacings.xs : 0 }}
              key={service.title}
            >
              <H3 mb="xs">{service.title}</H3>
              {service.items.map((item, idx) => (
                <Checkbox
                  isChecked={services
                    .map((s) => s.service)
                    .includes(item.title)}
                  mt={idx !== 0 ? 'xs' : undefined}
                  key={item.title}
                  hasBorder
                  onCheck={() => toggleServices(item.title, false)}
                  accessibilityHint={item.title}
                  label={
                    <View style={styles.labelContainer}>
                      <item.Icon color={Colors.PRIMARY_EXTRA_DARK} size="md" />
                      <BodyText ml="xs">{item.title}</BodyText>
                    </View>
                  }
                />
              ))}
            </View>
          ))}
          <OtherCategory services={services} toggleServices={toggleServices} />

          <Attachments
            images={requestedServicesImages}
            setImages={(array) => setValue('requestedServicesImages', array)}
          />
        </View>
      )}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attach: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 56,
    alignItems: 'center',
    marginTop: Spacings.xs,
  },
});
