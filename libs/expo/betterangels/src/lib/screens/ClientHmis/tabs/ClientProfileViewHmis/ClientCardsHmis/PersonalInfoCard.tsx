import { formatDateStatic } from '@monorepo/expo/shared/ui-components';
import {
  HmisClientProfileType,
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
} from '../../../../../apollo';
import {
  enumDisplayLanguage,
  enumDisplayLivingSituation,
  enumDobQualityHmis,
  enumVeteranStatusHmis,
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
    unhousedStartDate,
  } = client || {};

  const formattedDob =
    birthDate &&
    formatDateStatic({
      date: birthDate,
      inputFormat: 'yyyy-MM-dd',
    });

  const formattedUnhousedStartDate =
    unhousedStartDate &&
    formatDateStatic({
      date: unhousedStartDate,
      inputFormat: 'yyyy-MM-dd',
    });

  const content: TClientProfileCardItem[] = [
    {
      header: ['Date of Birth'],
      rows: [[formattedDob]],
    },
    {
      header: ['Quality of DOB'],
      rows: [[enumDobQualityHmis[dobQuality as HmisDobQualityEnum]]],
    },
    {
      header: ['Veteran Status'],
      rows: [[enumVeteranStatusHmis[veteran as HmisVeteranStatusEnum]]],
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
    {
      header: ['Approximate Date Homelessness Started'],
      rows: [[unhousedStartDate && formattedUnhousedStartDate]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
