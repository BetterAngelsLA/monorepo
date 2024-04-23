import {
  ArrowTrendUpIcon,
  BlanketIcon,
  BookOpenIcon,
  BottleWaterIcon,
  BriefcaseMedicalIcon,
  BurgerSodaIcon,
  CarIcon,
  EyeIcon,
  FaceAnxiousSweatIcon,
  FaceCloudsIcon,
  FaceDisappointedIcon,
  FaceFrownIcon,
  FaceHandYawnIcon,
  FaceLaughBeamIcon,
  FaceLaughIcon,
  FaceMehBlankIcon,
  FaceMehIcon,
  FaceMeltingIcon,
  FacePoutingIcon,
  FaceRelievedIcon,
  FaceSmileIcon,
  FaceSmileRelaxedIcon,
  FaceSmilingHandsIcon,
  FaceSpiralEyesIcon,
  FaceSunglassesIcon,
  FaceSwearIcon,
  FaceWearyIcon,
  PawIcon,
  PeopleRoofIcon,
  ShirtIcon,
  ShoePrintsIcon,
  ShowerIcon,
  SyringeIcon,
  ToothIcon,
  ToothbrushIcon,
  WarehouseIcon,
} from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import {
  MoodEnum,
  MoodType,
  ServiceEnum,
  ServiceRequestType,
} from '../../apollo';

const ICONS = [
  { Icon: BurgerSodaIcon, title: 'Food', enum: ServiceEnum.Food },
  { Icon: BottleWaterIcon, title: 'Water', enum: ServiceEnum.Water },
  { Icon: BlanketIcon, title: 'Blanket', enum: ServiceEnum.Blanket },
  { Icon: BookOpenIcon, title: 'Book', enum: ServiceEnum.Book },
  { Icon: ShirtIcon, title: 'Clothes', enum: ServiceEnum.Clothes },
  { Icon: PawIcon, title: 'Pet Food', enum: ServiceEnum.PetFood },
  { Icon: ShoePrintsIcon, title: 'Shoes', enum: ServiceEnum.Shoes },
  { Icon: ShowerIcon, title: 'Shower', enum: ServiceEnum.Shower },
  { Icon: PeopleRoofIcon, title: 'Shelter', enum: ServiceEnum.Shelter },
  { Icon: WarehouseIcon, title: 'Storage', enum: ServiceEnum.Storage },
  { Icon: CarIcon, title: 'Transport', enum: ServiceEnum.Transport },
  { Icon: ToothIcon, title: 'Dental', enum: ServiceEnum.Dental },
  { Icon: PawIcon, title: 'Pet Care', enum: ServiceEnum.PetCare },
  { Icon: FaceSmilingHandsIcon, title: 'Agreeable', enum: MoodEnum.Agreeable },
  { Icon: FaceSmileIcon, title: 'Euthymic', enum: MoodEnum.Euthymic },
  { Icon: FaceLaughBeamIcon, title: 'Happy', enum: MoodEnum.Happy },
  { Icon: FaceLaughIcon, title: 'Motivated', enum: MoodEnum.Motivated },
  { Icon: FaceRelievedIcon, title: 'Optimistic', enum: MoodEnum.Optimistic },
  { Icon: FaceSunglassesIcon, title: 'Personable', enum: MoodEnum.Personable },
  { Icon: FaceSmileRelaxedIcon, title: 'Pleasant', enum: MoodEnum.Pleasant },
  { Icon: FacePoutingIcon, title: 'Agitated', enum: MoodEnum.Agitated },
  {
    Icon: FaceSpiralEyesIcon,
    title: 'Disorganized Thought',
    enum: MoodEnum.DisorganizedThought,
  },
  { Icon: FaceMehBlankIcon, title: 'Flat/blunted', enum: MoodEnum.FlatBlunted },
  { Icon: FaceHandYawnIcon, title: 'Indifferent', enum: MoodEnum.Indifferent },
  { Icon: FaceFrownIcon, title: 'Restless', enum: MoodEnum.Restless },
  { Icon: FaceAnxiousSweatIcon, title: 'Anxious', enum: MoodEnum.Anxious },
  { Icon: FaceDisappointedIcon, title: 'Depressed', enum: MoodEnum.Depressed },
  { Icon: FaceMehIcon, title: 'Detached', enum: MoodEnum.Detached },
  { Icon: FaceMeltingIcon, title: 'Disoriented', enum: MoodEnum.Disoriented },
  { Icon: FaceSpiralEyesIcon, title: 'Escalated', enum: MoodEnum.Escalated },
  { Icon: FaceWearyIcon, title: 'Hopeless', enum: MoodEnum.Hopeless },
  { Icon: FaceSwearIcon, title: 'Manic', enum: MoodEnum.Manic },
  { Icon: FaceCloudsIcon, title: 'Suicidal', enum: MoodEnum.Suicidal },
  { Icon: ToothbrushIcon, title: 'Hygiene Kit', enum: ServiceEnum.HygieneKit },
  {
    Icon: SyringeIcon,
    title: 'Harm Reduction',
    enum: ServiceEnum.HarmReduction,
  },
  { Icon: BriefcaseMedicalIcon, title: 'Medical', enum: ServiceEnum.Medical },
  { Icon: ArrowTrendUpIcon, title: 'Stabilize', enum: ServiceEnum.Stabilize },
];

export default function NoteCardIcons({
  icons,
}: {
  icons: (MoodType | ServiceRequestType)[];
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icons.slice(0, 5).map((icon) => {
        let iconEnumValue: string;

        if ('descriptor' in icon) {
          iconEnumValue = icon.descriptor;
        } else {
          iconEnumValue = icon.service;
        }
        const iconObject = ICONS.find((i) => i.enum === iconEnumValue);

        if (iconObject && iconObject.Icon) {
          const IconComponent = iconObject.Icon;
          return (
            <IconComponent
              size="sm"
              color={Colors.NEUTRAL_DARK}
              key={icon.id}
              mr="xs"
            />
          );
        }
        return <EyeIcon color={Colors.NEUTRAL_DARK} />;
      })}
      {icons.length > 5 && (
        <BodyText color={Colors.NEUTRAL_DARK} size="sm">
          + {icons.length - 5}
        </BodyText>
      )}
    </View>
  );
}
