import {
  HmisClientProfileType,
  HmisNameQualityEnum,
  HmisSuffixEnum,
} from '../../../../../apollo';
import {
  enumDisplayHmisSuffix,
  enumHmisNameQuality,
} from '../../../../../static';
import {
  ClientProfileCard,
  ClientProfileCardContainer,
  TClientProfileCardItem,
} from '../../../../../ui-components';

type TProps = {
  client?: HmisClientProfileType;
};

export function FullNameCardHmis(props: TProps) {
  const { client } = props;

  const { firstName, lastName, nameMiddle, nameQuality, alias, nameSuffix } =
    client || {};

  const content: TClientProfileCardItem[] = [
    {
      header: ['First Name'],
      rows: [[firstName]],
    },
    {
      header: ['Middle Name'],
      rows: [[nameMiddle]],
    },
    {
      header: ['Last Name'],
      rows: [[lastName]],
    },
    {
      header: ['Name Data Quality'],
      rows: [[enumHmisNameQuality[nameQuality as HmisNameQualityEnum]]],
    },
    {
      header: ['Nickname'],
      rows: [[alias]],
    },
    {
      header: ['Suffix'],
      rows: [[enumDisplayHmisSuffix[nameSuffix as HmisSuffixEnum]]],
    },
  ];

  return (
    <ClientProfileCardContainer>
      <ClientProfileCard items={content} />
    </ClientProfileCardContainer>
  );
}
