import {
  ArrowTrendUpIcon,
  BlanketIcon,
  BookOpenIcon,
  BottleWaterIcon,
  BriefcaseMedicalIcon,
  BurgerSodaIcon,
  CarIcon,
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
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { ServiceEnum, ViewNoteQuery } from '../../apollo';

const ICONS = [
  { Icon: BurgerSodaIcon, title: 'Food', enum: ServiceEnum.Food },
  { Icon: BottleWaterIcon, title: 'Water', enum: ServiceEnum.Water },
  { Icon: BlanketIcon, title: 'Blanket', enum: ServiceEnum.Blanket },
  { Icon: BookOpenIcon, title: 'Book', enum: ServiceEnum.Book },
  { Icon: ShirtIcon, title: 'Clothes', enum: ServiceEnum.Clothes },
  { Icon: PawIcon, title: 'Pet Food', enum: ServiceEnum.PetFood },
  { Icon: SneakerIcon, title: 'Shoes', enum: ServiceEnum.Shoes },
  { Icon: ShowerIcon, title: 'Shower', enum: ServiceEnum.Shower },
  { Icon: PeopleRoofIcon, title: 'Shelter', enum: ServiceEnum.Shelter },
  { Icon: WarehouseIcon, title: 'Storage', enum: ServiceEnum.Storage },
  { Icon: CarIcon, title: 'Transport', enum: ServiceEnum.Transport },
  { Icon: ToothIcon, title: 'Dental', enum: ServiceEnum.Dental },
  { Icon: PawIcon, title: 'Pet Care', enum: ServiceEnum.PetCare },
  { Icon: ToothbrushIcon, title: 'Hygiene Kit', enum: ServiceEnum.HygieneKit },
  {
    Icon: SyringeIcon,
    title: 'Harm Reduction',
    enum: ServiceEnum.HarmReduction,
  },
  { Icon: BriefcaseMedicalIcon, title: 'Medical', enum: ServiceEnum.Medical },
  { Icon: ArrowTrendUpIcon, title: 'Stabilize', enum: ServiceEnum.Stabilize },
];

const getIcons = (
  array: {
    id: string;
    service?: ServiceEnum;
    customService?: string | null | undefined;
  }[]
) => {
  return array.slice(0, 4).map((icon) => {
    const iconEnumValue = (icon.service as string) || '';

    if (iconEnumValue === 'OTHER') {
      return (
        <PlusIcon
          key={icon.id}
          ml="xs"
          size="sm"
          color={Colors.PRIMARY_EXTRA_DARK}
        />
      );
    }

    const iconObject = ICONS.find((i) => i.enum === iconEnumValue);

    if (iconObject && iconObject.Icon) {
      const IconComponent = iconObject.Icon;
      return (
        <IconComponent
          size="sm"
          color={Colors.PRIMARY_EXTRA_DARK}
          key={icon.id}
          ml="xs"
        />
      );
    }
    return null;
  });
};

const SERVICES: {
  title: string;
  field: 'providedServices' | 'requestedServices';
}[] = [
  {
    title: 'Provided Services',
    field: 'providedServices',
  },
  {
    title: 'Requested Services',
    field: 'requestedServices',
  },
];

export default function NoteServices({
  note,
}: {
  note: ViewNoteQuery['note'] | undefined;
}) {
  return (
    <View
      style={{
        backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
        borderRadius: Radiuses.xxs,
        paddingHorizontal: Spacings.sm,
      }}
    >
      {SERVICES.map((service) => (
        <View key={service.title} style={styles.services}>
          <TextRegular size="sm">{service.title}</TextRegular>
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            {note?.[service.field] &&
              note[service.field].length > 0 &&
              getIcons(note[service.field])}

            {note?.[service.field] && note[service.field].length > 4 && (
              <TextRegular ml="xs" color={Colors.PRIMARY_EXTRA_DARK} size="sm">
                + {note?.[service.field].length - 4}
              </TextRegular>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  services: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.xs,
  },
});
