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
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

interface IProvidedServicesProps {
  expanded: string | undefined | null;
  setExpanded: (e: string | undefined | null) => void;
  // noteProvidedServices: string[] | undefined;
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

export default function ProvidedServices(props: IProvidedServicesProps) {
  const {
    expanded,
    setExpanded,
    //  noteProvidedServices
  } = props;
  const { setValue, watch, control } = useFormContext();
  const [providedOtherCategory, setProvidedOtherCategory] = useState<string[]>(
    []
  );

  const providedServicesImages = watch('providedServicesImages', []);
  const providedServices = watch('providedServices') || [];
  const isProvidedServices = expanded === 'Provided Services';
  const isLessThanOneProvidedService = providedServices.length < 1;
  const isLessThanOneProvidedServiceImages = providedServicesImages.length < 1;
  const isGreaterThanZeroProvidedService = providedServices.length > 0;
  const isGreaterThanZeroProvidedServiceImages =
    providedServicesImages?.length > 0;

  const toggleServices = (service: string) => {
    const newServices = providedServices.includes(service)
      ? providedServices.filter((m: string) => m !== service)
      : [...providedServices, service];
    setValue('providedServices', newServices);
  };

  useEffect(() => {
    if (!isProvidedServices) {
      const includedValues = providedOtherCategory.filter((element) =>
        providedServices.includes(element)
      );
      setProvidedOtherCategory(includedValues);
    }
  }, [expanded]);

  return (
    <FieldCard
      actionName={
        isProvidedServices &&
        isLessThanOneProvidedService &&
        isLessThanOneProvidedServiceImages ? (
          ''
        ) : isGreaterThanZeroProvidedService ||
          isGreaterThanZeroProvidedServiceImages ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {providedServices.map((service: string) => {
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
            {isGreaterThanZeroProvidedServiceImages && (
              <PaperclipIcon size="md" color={Colors.PRIMARY_EXTRA_DARK} />
            )}
          </View>
        ) : (
          <H5 size="sm">Add Services</H5>
        )
      }
      mb="xs"
      title="Provided Services"
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isProvidedServices ? null : 'Provided Services');
      }}
    >
      {isProvidedServices && (
        <View style={{ paddingBottom: Spacings.md }}>
          {SERVICES.map((service, idx) => (
            <View
              style={{ marginTop: idx !== 0 ? Spacings.xs : 0 }}
              key={service.title}
            >
              <H3 mb="xs">{service.title}</H3>
              {service.items.map((item, idx) => (
                <Checkbox
                  isChecked={providedServices.includes(item.title)}
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
            main="providedServices"
            other="providedOtherCategory"
            otherCategories={providedOtherCategory}
            setOtherCategories={setProvidedOtherCategory}
            control={control}
            setValue={setValue}
            services={providedServices}
          />
          <Attachments
            images={providedServicesImages}
            setImages={(array) => setValue('providedServicesImages', array)}
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
});
