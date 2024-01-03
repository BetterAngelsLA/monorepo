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
import { useFormContext } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

interface IProvidedServicesProps {
  expanded: string | undefined;
  setExpanded: (e: string | undefined) => void;
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
];

export default function ProvidedServices(props: IProvidedServicesProps) {
  const { expanded, setExpanded } = props;
  const { setValue, watch } = useFormContext();

  const providedServices = watch('providedServices') || [];

  const toggleServices = (service: string) => {
    const newServices = providedServices.includes(service)
      ? providedServices.filter((m: string) => m !== service)
      : [...providedServices, service];
    setValue('providedServices', newServices);
  };
  return (
    <FieldCard
      actionName={
        expanded === 'Provided Services' && providedServices.length < 1 ? (
          ''
        ) : providedServices.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {providedServices.map((service: string) => {
              const IconComponent = ICONS[service];
              return (
                <IconComponent
                  mr="xs"
                  my="xs"
                  key={service}
                  size="sm"
                  color={Colors.PRIMARY_EXTRA_DARK}
                />
              );
            })}
          </View>
        ) : (
          <H5 size="sm">Add Services</H5>
        )
      }
      mb="xs"
      title="Provided Services"
      expanded={expanded}
      setExpanded={() =>
        setExpanded(
          expanded === 'Provided Services' ? undefined : 'Provided Services'
        )
      }
    >
      {expanded === 'Provided Services' && (
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
                      <item.Icon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
                      <BodyText ml="xs">{item.title}</BodyText>
                    </View>
                  }
                />
              ))}
            </View>
          ))}
          <View style={{ marginTop: Spacings.xs }}>
            <H3 mb="xs">Other Items</H3>
            <Checkbox
              isChecked={providedServices.includes('Stabilize')}
              hasBorder
              onCheck={() => toggleServices('Stabilize')}
              accessibilityHint="Stabilize"
              label={
                <View style={styles.labelContainer}>
                  <ArrowTrendUpIcon
                    color={Colors.PRIMARY_EXTRA_DARK}
                    size="sm"
                  />
                  <BodyText ml="xs">Stabilize</BodyText>
                </View>
              }
            />
            <Checkbox
              mt="xs"
              isChecked={providedServices.includes('Other')}
              hasBorder
              onCheck={() => toggleServices('Other')}
              accessibilityHint="Other"
              label={
                <View style={styles.labelContainer}>
                  <PlusIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
                  <BodyText ml="xs">Other</BodyText>
                </View>
              }
            />
          </View>
          <Pressable
            style={styles.attach}
            accessible
            accessibilityRole="button"
            accessibilityHint="attach a file"
          >
            <BodyText>Attachments</BodyText>
            <PaperclipIcon color={Colors.PRIMARY_EXTRA_DARK} size="sm" />
          </Pressable>
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
