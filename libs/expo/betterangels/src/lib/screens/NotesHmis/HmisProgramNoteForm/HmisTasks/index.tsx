import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CTAButton,
  FieldCard,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { useModalScreen } from '../../../../providers';

import { useFormContext } from 'react-hook-form';

import { DraftTask } from '../formSchema';
import HmisTaskModal from './HmisTaskModal';

type HmisTasksProps = {
  tasks: DraftTask[];
};

export default function HmisTasks(props: HmisTasksProps) {
  const { tasks } = props;
  const { showModalScreen } = useModalScreen();
  const { setValue } = useFormContext();

  const openModal = (taskToEdit?: DraftTask) => {
    const taskProp = taskToEdit
      ? ({
          id: taskToEdit.id,
          summary: taskToEdit.summary,
          description: taskToEdit.description || '',
          status: taskToEdit.status,
          team: taskToEdit.team,
          markedForDeletion: taskToEdit.markedForDeletion,
        } as DraftTask)
      : undefined;

    showModalScreen({
      presentation: 'fullScreenModal',
      title: 'Follow-Up Task',
      renderContent: ({ close }) => (
        <HmisTaskModal
          task={taskProp}
          closeModal={close}
          onSubmit={(data) =>
            setValue('tasks', [data, ...tasks.filter((t) => t.id !== data.id)])
          }
          onDelete={
            taskProp?.id
              ? () =>
                  setValue(
                    'tasks',
                    tasks.map((t) => {
                      if (t.id === taskProp.id) {
                        return { ...t, markedForDeletion: true };
                      }
                      return t;
                    })
                  )
              : undefined
          }
        />
      ),
    });
  };
  return (
    <FieldCard
      mb="xs"
      actionName=""
      title="Follow-Up Tasks"
      setExpanded={() => {
        // If the list is empty, clicking the header/card opens the Add Modal
        if (!tasks.filter((item) => !item.markedForDeletion).length) {
          return openModal();
        }
      }}
    >
      <View style={{ gap: Spacings.xs }}>
        {tasks
          .filter((item) => !item.markedForDeletion)
          .map((item, index) => (
            <CTAButton
              key={item.id || index}
              onPress={() => openModal(item)}
              label={item.summary || 'Untitled Task'}
            />
          ))}
      </View>

      {/* 3. Bottom Button: ONLY show if we have at least 1 task */}
      {tasks.filter((item) => !item.markedForDeletion).length > 0 && (
        <View style={{ paddingVertical: Spacings.md }}>
          <TextButton
            title="Add Another Task"
            onPress={() => openModal()}
            color={Colors.PRIMARY}
            accessibilityHint="Adds a new task"
          />
        </View>
      )}
    </FieldCard>
  );
}
