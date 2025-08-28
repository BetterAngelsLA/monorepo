import { Colors } from '@monorepo/expo/shared/static';
import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { format } from 'date-fns';
import { View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskCardBodyProps = {
  description: TaskType['description'];
  createdAt: TaskType['createdAt'];
};

export default function TaskCardBody(props: TaskCardBodyProps) {
  const { description, createdAt } = props;

  return (
    <View>
      {description && (
        <>
          <TextRegular size="xs">Description</TextRegular>
          <TextBold mb="sm" size="sm">
            {description}
          </TextBold>
        </>
      )}
      <TextRegular color={Colors.NEUTRAL_DARK} size="sm">
        {format(new Date(createdAt), 'MM/dd/yyyy')}
      </TextRegular>
    </View>
  );
}
