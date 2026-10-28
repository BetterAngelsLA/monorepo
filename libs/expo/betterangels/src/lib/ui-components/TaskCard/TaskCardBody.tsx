import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { formatScalarDate } from '@monorepo/shared/scalars';
import { StyleSheet, View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskCardBodyProps = {
  description: TaskType['description'];
  createdAt: TaskType['createdAt'];
  /** The creator's display name; rendered as `by …` beside the date. */
  createdBy?: string;
};

export default function TaskCardBody(props: TaskCardBodyProps) {
  const { description, createdAt, createdBy } = props;

  return (
    <View>
      {description ? (
        <>
          <TextRegular size="xs">Description</TextRegular>
          <TextBold
            style={{ flex: 1 }}
            numberOfLines={2}
            ellipsizeMode="tail"
            mb="sm"
            size="sm"
          >
            {description}
          </TextBold>
        </>
      ) : null}
      {/*
        Attribution and timestamp sit at opposite ends rather than being joined
        into one sentence: `by X · date` was 341px against the 343px a 375pt
        phone leaves inside the card, so the affiliation silently disappeared.
        Two ends also give the list a shared right edge for its dates.
      */}
      <View style={styles.footer}>
        {!!createdBy && (
          <TextRegular
            size="xs"
            color={Colors.NEUTRAL_DARK}
            numberOfLines={1}
            style={styles.attribution}
          >
            by {createdBy}
          </TextRegular>
        )}
        <TextRegular size="xs" color={Colors.NEUTRAL_DARK} numberOfLines={1}>
          {formatScalarDate(createdAt, 'MM/dd/yyyy')}
        </TextRegular>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  attribution: {
    flexShrink: 1,
  },
});
