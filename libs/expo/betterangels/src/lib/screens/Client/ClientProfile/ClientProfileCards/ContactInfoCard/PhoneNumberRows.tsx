import { StarIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { formatPhoneNumber } from '@monorepo/expo/shared/utils';
import { ReactElement } from 'react';
import { View } from 'react-native';
import useSnackbar from '../../../../../hooks/snackbar/useSnackbar';
import { getPhoneActions } from './contactActions';
import { ContactInfoRow } from './ContactInfoRow';

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
  const { showSnackbar } = useSnackbar();

  if (!number) {
    return null;
  }

  const [formatted, extension] = formatPhoneNumber(number);

  if (!formatted) {
    return null;
  }

  const displayText = extension ? `${formatted} ext.${extension}` : formatted;
  const dialNumber = extension ? `${formatted},${extension}` : formatted;

  return (
    <ContactInfoRow
      menuTitle="Phone number"
      triggerAccessibilityLabel={`Phone number ${displayText} actions`}
      actions={getPhoneActions(displayText, dialNumber, { showSnackbar })}
      suffix={
        isPrimary ? (
          <View>
            <StarIcon color={Colors.WARNING} size="md" />
          </View>
        ) : null
      }
    >
      <TextBold selectable size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
        {displayText}
      </TextBold>
    </ContactInfoRow>
  );
}
