import { Colors } from '@monorepo/expo/shared/static';
import { TextBold } from '@monorepo/expo/shared/ui-components';
import { referralArrival } from '../shared/referralPresentation';
import { useReferralDay } from './useReferralDay';

export function RequestedArrivalDate({ value }: { value: unknown }) {
  const arrival = referralArrival(value, useReferralDay());
  const label =
    arrival?.label ??
    (value != null && value !== ''
      ? 'Unrecognized saved date'
      : 'Not recorded');
  return (
    <TextBold
      testID="referral-arrival-date"
      size="ms"
      color={arrival?.isPast ? Colors.ERROR : Colors.PRIMARY_EXTRA_DARK}
      accessibilityLiveRegion="polite"
    >
      Requested arrival: {label}
      {arrival?.isPast ? ' (Past)' : ''}
    </TextBold>
  );
}
