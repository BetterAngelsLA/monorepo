import { formatScalarDate } from '@monorepo/shared/scalars';
import {
  HmisClientProfileType,
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
} from '../../../apollo';
import { enumDobQualityHmis, enumVeteranStatusHmis } from '../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

/**
 * hmisProd variant of `PersonalInfoCardHmis` — v1 only renders fields that
 * exist in Clarity (DOB, quality, veteran status). The BA-only rows (CA ID#,
 * preferred language, living situation, homelessness start) are omitted until
 * they have a direct-REST source.
 */
export function PersonalInfoCardHmisProd(props: TProps) {
  const { client } = props;

  const { birthDate, dobQuality, veteran } = client || {};

  const formattedDob = birthDate && formatScalarDate(birthDate, 'MM/dd/yyyy');

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
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
