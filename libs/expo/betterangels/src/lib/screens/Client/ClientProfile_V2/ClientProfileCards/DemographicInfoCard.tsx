import { getFormattedLength } from '@monorepo/expo/shared/ui-components';
import {
  enumDisplayEyeColor,
  enumDisplayHairColor,
  enumDisplayRace,
} from '../../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../ui-components';
import { TClientProfile } from '../types';

type TProps = {
  clientProfile?: TClientProfile;
};

export function DemographicInfoCard(props: TProps) {
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

  const content: TClientProfileCardItem[] = [
    {
      header: ['Gender'],
      rows: [[displayGender]],
    },
    {
      header: ['Pronouns'],
      rows: [[displayPronouns]],
    },
    {
      header: ['Race'],
      rows: [[race && enumDisplayRace[race]]],
    },
    {
      header: ['Place of Birth'],
      rows: [[placeOfBirth]],
    },
    {
      header: ['Height'],
      rows: [[formattedHeight]],
    },
    {
      header: ['Eye Color'],
      rows: [[eyeColor && enumDisplayEyeColor[eyeColor]]],
    },
    {
      header: ['Hair Color'],
      rows: [[hairColor && enumDisplayHairColor[hairColor]]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard
        items={content}
        action={{
          onClick: () => alert('edit demo information'),
          accessibilityLabel: 'edit demo information',
        }}
      />
    </ClientProfileCardContainer>
  );
}
