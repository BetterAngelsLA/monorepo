import { StarIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
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

  return numbers
    .map((n) => ({
      ...n,
      isPrimary: !!n.isPrimary,
    }))
    .sort((a, b) => {
      return Number(b.isPrimary) - Number(a.isPrimary);
    })
    .map((phone, idx) => {
      const row = (
        <PhoneNumberRow
          key={idx}
          number={phone.number}
          isPrimary={phone.isPrimary}
        />
      );

      return [row];
    });
}

function PhoneNumberRow(props: TPhoneNumber) {
  const { number, isPrimary } = props;

  if (!number) {
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
      {isPrimary && <StarIcon color={Colors.WARNING} />}
      <TextBold size="sm">{formatPhoneNumber(number)}</TextBold>
    </View>
  );
}
