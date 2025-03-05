import { getFormattedLength } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import {
  enumDisplayEyeColor,
  enumDisplayHairColor,
  enumDisplayRace,
} from '../../../../static';
import { ClientProfileCard } from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export default function DemographicInfo(props: TProps) {
  const { clientProfile } = props;

  const {
    displayGender,
    displayPronouns,
    eyeColor,
    hairColor,
    heightInInches,
    placeOfBirth,
    race,
  } = clientProfile || {};

  const formattedHeight = getFormattedLength({
    length: heightInInches,
    inputUnit: 'inches',
    outputUnit: 'inches',
    format: 'feet-inches-symbol',
  });

  const content = [
    {
      title: 'Gender',
      content: displayGender,
    },
    {
      title: 'Pronouns',
      content: displayPronouns,
    },
    {
      title: 'Race',
      content: race && enumDisplayRace[race],
    },
    {
      title: 'Place of Birth',
      content: placeOfBirth,
    },
    {
      title: 'Height',
      content: formattedHeight,
    },
    {
      title: 'Eye Color',
      content: eyeColor && enumDisplayEyeColor[eyeColor],
    },
    {
      title: 'Hair Color',
      content: hairColor && enumDisplayHairColor[hairColor],
    },
  ];

  return (
    <View>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('clicked'),
          accessibilityLabel: 'edit name information',
        }}
      />
    </View>
  );
}
