import {
  HmisClientType,
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
  client?: HmisClientType;
};

export function FullNameCardHmis(props: TProps) {
  const { client } = props;

  const { firstName, lastName, nameDataQuality, data } = client || {};
  const { middleName, alias, nameSuffix } = data || {};

  const content: TClientProfileCardItem[] = [
    {
      header: ['First Name'],
      rows: [[firstName]],
    },
    {
      header: ['Middle Name'],
      rows: [[middleName]],
    },
    {
      header: ['Last Name'],
      rows: [[lastName]],
    },
    {
      header: ['Name Data Quality'],
      rows: [[enumHmisNameQuality[nameDataQuality as HmisNameQualityEnum]]],
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
