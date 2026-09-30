import { CircleSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { HmisProdClientHistoryItem } from '../../../../api';
import { presentDateHmisProd } from '../../../../utils';

const TYPE_LABELS: Record<string, string> = {
  demographic: 'Demographic',
  program: 'Program',
  service: 'Service',
};

/** `09/28/2026 (today)`, or the raw value when it isn't a parseable date. */
const formatHistoryDate = (value: string): string => {
  const { date, relative } = presentDateHmisProd(value);

  return relative ? `${date} (${relative})` : date;
};

type TProps = {
  item: HmisProdClientHistoryItem;
};

export function HistoryCard(props: TProps) {
  const { item } = props;
  const { type, data } = item;

  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : null;
  const isActive = !data.end_date;
  const startLabel = data.start_date ? formatHistoryDate(data.start_date) : '—';
  const endLabel = data.end_date ? formatHistoryDate(data.end_date) : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <TextBold size="sm" style={styles.name}>
            {data.name ?? '—'}
          </TextBold>

          {isActive && (
            <View
              accessible
              accessibilityLabel="Currently active"
              accessibilityHint="No end date recorded"
            >
              <CircleSolidIcon size="xs" color={Colors.SUCCESS} />
            </View>
          )}
        </View>

        {!!typeLabel && (
          <TextRegular size="xs" color={Colors.PRIMARY}>
            {typeLabel}
          </TextRegular>
        )}
      </View>

      {!!data.agency && (
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {`Agency: ${data.agency}`}
        </TextRegular>
      )}

      {!!data.agency_message && (
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {data.agency_message}
        </TextRegular>
      )}

      <View style={styles.dates}>
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {`Start: ${startLabel}`}
        </TextRegular>

        {endLabel ? (
          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            {`End: ${endLabel}`}
          </TextRegular>
        ) : (
          <TextRegular size="xs" color={Colors.SUCCESS_DARK}>
            active
          </TextRegular>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    gap: Spacings.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacings.xs,
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: Spacings.xxs,
  },
  name: {
    flexShrink: 1,
  },
  dates: {
    gap: Spacings.xxs,
  },
});
