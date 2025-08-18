import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { IconButton, TextBold } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { useModalScreen } from '../../../providers';
import { MainContainer, TaskForm } from '../../../ui-components';
import { ClientProfileQuery } from '../__generated__/Client.generated';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function TasksTab(props: TProps) {
  const { client } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  function openTaskForm() {
    showModalScreen({
      presentation: 'modal',
      content: (
        <TaskForm
          onCancel={() => {
            closeModalScreen();
          }}
          onSuccess={(taskId) => {
            closeModalScreen();
            alert(`Created Task ID ${taskId}`);
          }}
        />
      ),
      title: 'Follow-Up Task',
    });
  }

  return (
    <MainContainer pb={0} bg={Colors.NEUTRAL_EXTRA_LIGHT}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextBold>Tasks</TextBold>
        <IconButton
          variant="secondary"
          borderColor={Colors.WHITE}
          accessibilityLabel="open Task form"
          accessibilityHint="opens Task form"
          onPress={openTaskForm}
        >
          <PlusIcon />
        </IconButton>
      </View>
    </MainContainer>
  );
}
