import { formatDateStatic } from '@monorepo/expo/shared/ui-components';
import {
  HmisClientProfileType,
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
} from '../../../../../apollo';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumHmisDobQuality,
  enumHmisVeteranStatusEnum,
} from '../../../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

export function PersonalInfoCardHmis(props: TProps) {
  const { client } = props;

  const {
    birthDate,
    dobQuality,
    veteran,
    californiaId,
    preferredLanguage,
    livingSituation,
  } = client || {};

  const formattedDob =
    birthDate &&
    formatDateStatic({
      date: birthDate,
      inputFormat: 'yyyy-MM-dd',
    });

  const content: TClientProfileCardItem[] = [
    {
      header: ['Date of Birth'],
      rows: [[formattedDob]],
    },
    {
      header: ['Quality of DOB'],
      rows: [[enumHmisDobQuality[dobQuality as HmisDobQualityEnum]]],
    },
    {
      header: ['Veteran Status'],
      rows: [[enumHmisVeteranStatusEnum[veteran as HmisVeteranStatusEnum]]],
    },
    {
      header: ['CA ID#'],
      rows: [[californiaId]],
    },
    {
      header: ['Preferred Language'],
      rows: [[preferredLanguage && enumDisplayLanguage[preferredLanguage]]],
    },
    {
      header: ['Living Situation'],
      rows: [[livingSituation && enumDisplayLivingSituation[livingSituation]]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
