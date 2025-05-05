import { StarIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { ReactElement } from 'react';
import { View } from 'react-native';

type TPhoneNumber = {
  number?: string;
  isPrimary?: boolean | null;
};

type TPhoneNumbers = {
  numbers?: TPhoneNumber[] | null;
};

export function PhoneNumberRows(props: TPhoneNumbers) {
  const { numbers } = props;

  if (!numbers?.length) {
    return [];
  }

  const normalizedPhones = numbers.map((n) => ({
    ...n,
    isPrimary: !!n.isPrimary,
  }));

  normalizedPhones.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const rows: ReactElement[][] = [];

  normalizedPhones.forEach((phone, idx) => {
    const row = (
      <PhoneNumberRow
        key={idx}
        number={phone.number}
        isPrimary={phone.isPrimary}
      />
    );

    if (row) {
      rows.push([row]);
    }
  });

  return rows;
}

function PhoneNumberRow(props: TPhoneNumber) {
  const { number, isPrimary } = props;

  const formattedNumber = number && formatPhoneNumber(number);

  if (!formattedNumber) {
    return null;
  }

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: Spacings.xs,
        alignItems: 'center',
      }}
    >
      <TextBold size="sm">{formattedNumber}</TextBold>
      {isPrimary && <StarIcon color={Colors.WARNING} size="md" />}
    </View>
  );
}
