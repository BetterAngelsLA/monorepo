import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { formatScalarDate } from '@monorepo/shared/scalars';
import { View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskCardBodyProps = {
  description: TaskType['description'];
  createdAt: TaskType['createdAt'];
  /** `Created by …`, rendered with the date as the card's footer. */
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
        Date and provenance share the footer: both answer "where did this come
        from", and neither is worth a row of its own above the description.
      */}
      <TextRegular color={Colors.NEUTRAL_DARK} size="xs" numberOfLines={1}>
        {[formatScalarDate(createdAt, 'MM/dd/yyyy'), createdBy]
          .filter(Boolean)
          .join(' · ')}
      </TextRegular>
    </View>
  );
}
