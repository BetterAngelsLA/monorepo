import { CircleSolidIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { StyleSheet, View } from 'react-native';
import { HmisProdClientProgramItem } from '../../../../api';
import {
  formatDateWithRelativeHmisProd,
  hasStartedHmisProd,
} from '../../../../utils';

type TProps = {
  item: HmisProdClientProgramItem;
};

export function ProgramCard(props: TProps) {
  const { item } = props;
  const { agency, end_date, program, start_date } = item;

  const categoryName = program?.category?.value_name;
  const isActive = !end_date && hasStartedHmisProd(start_date);
  const startLabel = start_date
    ? formatDateWithRelativeHmisProd(start_date)
    : '—';
  const endLabel = end_date ? formatDateWithRelativeHmisProd(end_date) : null;
  const endDateText = endLabel ?? (isActive ? 'active' : '—');

  return (
    <View style={styles.container}>
      <View style={styles.nameBlock}>
        <TextBold size="sm" style={styles.name}>
          {program?.name ?? '—'}
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

      {!!categoryName && (
        <TextRegular size="xs" color={Colors.PRIMARY}>
          {categoryName}
        </TextRegular>
      )}

      {!!agency?.name && (
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {`Agency: ${agency.name}`}
        </TextRegular>
      )}

      <View style={styles.dates}>
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {`Entry: ${startLabel}`}
        </TextRegular>

        <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
          {'Exit: '}
          <TextRegular
            size="xs"
            color={isActive ? Colors.SUCCESS_DARK : Colors.NEUTRAL_DARK}
          >
            {endDateText}
          </TextRegular>
        </TextRegular>
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
