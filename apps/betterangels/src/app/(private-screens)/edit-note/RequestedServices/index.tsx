import { Attachments, OtherCategory } from '@monorepo/expo/betterangels';
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
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface IRequestedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  // noteRequestedServices: string[] | undefined;
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
  const {
    expanded,
    setExpanded,
    // noteRequestedServices
  } = props;
  const { setValue, watch, control } = useFormContext();
  const [requestedOtherCategory, setRequestedOtherCategory] = useState<
    string[]
  >([]);

  const requestedServicesImages = watch('requestedServicesImages', []);
  const watchedRequestedServices = watch('requestedServices');
  const requestedServices = useMemo(() => {
    return watchedRequestedServices || [];
  }, [watchedRequestedServices]);
  const isRequestedServices = expanded === 'Requested Services';
  const isLessThanOneRequestedService = requestedServices.length < 1;
  const isLessThanOneRequestedServiceImages =
    requestedServicesImages.length < 1;
  const isGreaterThanZeroRequestedService = requestedServices.length > 0;
  const isGreaterThanZeroRequestedServiceImages =
    requestedServicesImages?.length > 0;

  const toggleServices = (service: string) => {
    const newServices = requestedServices.includes(service)
      ? requestedServices.filter((m: string) => m !== service)
      : [...requestedServices, service];
    setValue('requestedServices', newServices);
  };

  useEffect(() => {
    if (!isRequestedServices) {
      const includedValues = requestedOtherCategory.filter((element) =>
        requestedServices.includes(element)
      );
      setRequestedOtherCategory(includedValues);
    }
  }, [
    expanded,
    // NOTE: adding these causes infinte rerender
    // isRequestedServices,
    // requestedOtherCategory,
    // requestedServices,
  ]);

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
            {requestedServices.map((service: string) => {
              const IconComponent = ICONS[service] || PlusIcon;
              return (
                <IconComponent
                  mr="xs"
                  key={service}
                  size="md"
                  color={Colors.PRIMARY_EXTRA_DARK}
                />
              );
            })}
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
                  isChecked={requestedServices.includes(item.title)}
                  mt={idx !== 0 ? 'xs' : undefined}
                  key={item.title}
                  hasBorder
                  onCheck={() => toggleServices(item.title)}
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
          <OtherCategory
            main="requestedServices"
            other="requestedOtherCategory"
            services={requestedServices}
            setValue={setValue}
            control={control}
            otherCategories={requestedOtherCategory}
            setOtherCategories={setRequestedOtherCategory}
          />

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
