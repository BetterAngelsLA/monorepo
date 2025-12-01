import { useMutation } from '@apollo/client/react';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CTAButton,
  FieldCard,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SelahTeamEnum,
  TaskStatusEnum,
  UpdateTaskInput,
  ViewNoteQuery,
} from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
// Ensure correct paths
import { CreateTaskDocument } from '../TaskForm/__generated__/createTask.generated';
import { UpdateTaskDocument } from '../TaskForm/__generated__/updateTask.generated';
import { TaskFormData } from '../TaskForm/TaskForm';
import NoteTasksModal from './NoteTaskModal';

interface INoteTasksProps {
  clientProfileId: string;
  noteId?: string;
  scrollRef: RefObject<ScrollView | null>;
  tasks?: ViewNoteQuery['note']['tasks'];
  refetch?: () => void;
  team?: SelahTeamEnum | null;
  onDraftTasksChange?: (tasks: UpdateTaskInput[]) => void;
}

export default function NoteTasks(props: INoteTasksProps) {
  const {
    clientProfileId,
    noteId,
    tasks: serverTasks,
    scrollRef,
    refetch,
    team,
    onDraftTasksChange,
  } = props;
  const { showModalScreen } = useModalScreen();
  const { showSnackbar } = useSnackbar();

  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);

  const [draftTasks, setDraftTasks] = useState<UpdateTaskInput[]>([]);
  const isDraftMode = !noteId;
  const displayTasks = isDraftMode ? draftTasks : serverTasks || [];

  useEffect(() => {
    if (isDraftMode && onDraftTasksChange) {
      onDraftTasksChange(draftTasks);
    }
  }, [draftTasks, isDraftMode, onDraftTasksChange]);

  const handleSave = async (
    data: TaskFormData,
    existingTask?: UpdateTaskInput
  ) => {
    // Helper to clean empty strings into valid Enum/null/undefined
    const cleanStatus = data.status === '' ? undefined : data.status;
    const cleanTeam = data.team === '' ? null : data.team;

    if (isDraftMode) {
      await new Promise((r) => setTimeout(r, 100));
      const newTask: UpdateTaskInput = {
        id: existingTask?.id || `temp-${Date.now()}`,
        summary: data.summary,
        description: data.description || undefined,
        status: cleanStatus || TaskStatusEnum.ToDo, // Fallback for draft
        team: cleanTeam || team || null,
      };
      setDraftTasks((prev) =>
        existingTask
          ? prev.map((t) => (t.id === existingTask.id ? newTask : t))
          : [...prev, newTask]
      );
      return;
    }

    try {
      if (existingTask?.id) {
        await updateTask({
          variables: {
            data: {
              ...data,
              status: cleanStatus, // Use cleaned value
              team: cleanTeam, // Use cleaned value
              id: existingTask.id,
            },
          },
        });
      } else {
        await createTask({
          variables: {
            data: {
              ...data,
              status: cleanStatus, // Use cleaned value
              clientProfile: clientProfileId,
              note: noteId,
              team: cleanTeam || team || null, // Use cleaned value
            },
          },
        });
      }
      refetch?.();
    } catch (err) {
      showSnackbar({ message: 'Failed to save', type: 'error' });
      throw err;
    }
  };

  const handleDelete = (task: UpdateTaskInput) => {
    if (isDraftMode) {
      setDraftTasks((prev) => prev.filter((t) => t.id !== task.id));
    }
  };

  const openModal = (taskToEdit?: UpdateTaskInput) => {
    showModalScreen({
      presentation: 'fullScreenModal',
      hideHeader: true,
      content: (
        <NoteTasksModal
          initialValues={{
            summary: taskToEdit?.summary || '',
            description: taskToEdit?.description || undefined,
            status: taskToEdit?.status || undefined,
            team: (taskToEdit?.team as SelahTeamEnum) || team || '',
          }}
          onSubmit={(data) => handleSave(data, taskToEdit)}
          onDelete={taskToEdit ? () => handleDelete(taskToEdit) : undefined}
        />
      ),
    });
  };

  if (!isDraftMode && !serverTasks) return null;

  return (
    <FieldCard
      scrollRef={scrollRef}
      mb="xs"
      actionName=""
      title="Follow-Up Tasks"
      setExpanded={() => {
        if (!displayTasks.length) openModal();
      }}
    >
      {!!displayTasks.length && (
        <View style={{ gap: Spacings.xs }}>
          {displayTasks.map((item, index) => (
            <CTAButton
              key={item.id || index}
              onPress={() => openModal(item)}
              label={item.summary || 'Untitled Task'}
            />
          ))}
        </View>
      )}
      {(!!displayTasks.length || isDraftMode) && (
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
