import { formatDateStatic } from '@monorepo/expo/shared/ui-components';
import {
  enumHmisDobQuality,
  enumHmisVeteranStatusEnum,
} from 'libs/expo/betterangels/src/lib/static';
import {
  HmisClientType,
  HmisDobQualityEnum,
  HmisVeteranStatusEnum,
} from '../../../../../apollo';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientType;
};

export function PersonalInfoCardHmis(props: TProps) {
  const { client } = props;

  const { dob, dobDataQuality, data } = client || {};
  const { veteranStatus } = data || {};

  const formattedDob =
    dob &&
    formatDateStatic({
      date: dob,
      inputFormat: 'yyyy-MM-dd',
    });

  const content: TClientProfileCardItem[] = [
    {
      header: ['Date of Birth'],
      rows: [[formattedDob]],
    },
    {
      header: ['Quality of DOB'],
      rows: [[enumHmisDobQuality[dobDataQuality as HmisDobQualityEnum]]],
    },
    {
      header: ['Veteran Status'],
      rows: [
        [enumHmisVeteranStatusEnum[veteranStatus as HmisVeteranStatusEnum]],
      ],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
