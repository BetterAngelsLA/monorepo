import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskSummaryBodyProps = {
  description: TaskType['description'];
};

export default function TaskSummaryBody(props: TaskSummaryBodyProps) {
  const { description } = props;

  return (
    <View>
      <TextRegular mb="sm" size="sm">
        Description
      </TextRegular>
      <TextBold size="sm">{description}</TextBold>
    </View>
  );
}
