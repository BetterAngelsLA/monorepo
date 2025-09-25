import { TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { TaskType } from '../../apollo';

type TaskBodyProps = {
  description: TaskType['description'];
};

export default function TaskBody(props: TaskBodyProps) {
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
