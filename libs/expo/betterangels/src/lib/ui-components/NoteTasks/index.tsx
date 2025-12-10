import { useMutation } from '@apollo/client/react';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  CTAButton,
  FieldCard,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';
import { SelahTeamEnum, TaskStatusEnum, UpdateTaskInput } from '../../apollo';
import { useSnackbar } from '../../hooks';
import { useModalScreen } from '../../providers';
import { LocalDraftTask } from '../../screens/NotesHmis/HmisProgramNoteForm/formSchema';
import { CreateTaskDocument } from '../TaskForm/__generated__/createTask.generated';
import { DeleteTaskDocument } from '../TaskForm/__generated__/deleteTask.generated';
import { UpdateTaskDocument } from '../TaskForm/__generated__/updateTask.generated';
import NoteTasksModal from './NoteTaskModal';

// Define the Form Data Interface Locally if not exported elsewhere
export interface TaskFormData {
  id?: string;
  summary: string;
  description?: string;
  status?: TaskStatusEnum;
  team?: SelahTeamEnum | '';
}

interface INoteTasksProps {
  clientProfileId?: string;
  hmisClientProfileId?: string;
  noteId?: string;
  hmisNoteId?: string;
  scrollRef: RefObject<ScrollView | null>;

  // Mode Props
  isDraftMode?: boolean;
  tasks?: (UpdateTaskInput | LocalDraftTask)[];
  onDraftTasksChange?: (tasks: LocalDraftTask[]) => void;

  // Live Handlers
  refetch?: () => void;
  team?: SelahTeamEnum | null;

  // Visibility
  hideIfEmpty?: boolean;
}

export default function NoteTasks(props: INoteTasksProps) {
  const {
    clientProfileId,
    hmisClientProfileId,
    noteId,
    hmisNoteId,
    tasks = [],
    scrollRef,
    refetch,
    team,
    isDraftMode = false,
    onDraftTasksChange,
    hideIfEmpty = false,
  } = props;

  const { showModalScreen, closeModalScreen } = useModalScreen();
  const { showSnackbar } = useSnackbar();

  // --- MUTATIONS ---
  const [createTask] = useMutation(CreateTaskDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);
  const [deleteTask] = useMutation(DeleteTaskDocument);

  // --- DRAFT HANDLERS ---
  const handleDraftSave = (data: TaskFormData, existingId?: string) => {
    if (!onDraftTasksChange) return;

    const newTask: LocalDraftTask = {
      id: existingId || `temp-${Date.now()}`,
      summary: data.summary,
      description: data.description || null,
      status: (data.status as TaskStatusEnum) || TaskStatusEnum.ToDo,
      team: (data.team as SelahTeamEnum) || team || null,
    };

    if (existingId) {
      const updatedList = (tasks as LocalDraftTask[]).map((t) =>
        t.id === existingId ? newTask : t
      );
      onDraftTasksChange(updatedList);
    } else {
      onDraftTasksChange([...(tasks as LocalDraftTask[]), newTask]);
    }
  };

  const handleDraftDelete = (id: string) => {
    if (!onDraftTasksChange) return;
    const updatedList = (tasks as LocalDraftTask[]).filter((t) => t.id !== id);
    onDraftTasksChange(updatedList);
  };

  // --- LIVE HANDLERS ---
  const handleLiveSave = async (data: TaskFormData, existingId?: string) => {
    try {
      const cleanStatus = data.status || undefined;
      const cleanTeam = data.team === '' ? null : data.team;

      if (existingId) {
        await updateTask({
          variables: {
            data: {
              ...data,
              status: cleanStatus,
              team: cleanTeam,
              id: existingId,
            },
          },
        });
      } else {
        delete data.id;
        await createTask({
          variables: {
            data: {
              ...data,
              status: cleanStatus,
              clientProfile: clientProfileId,
              hmisClientProfile: hmisClientProfileId,
              team: cleanTeam || team || null,
              // Handle linking to either Note type
              note: noteId || null,
              // Ensure this field name matches your Schema (hmisNote vs hmisProgramNote)
              hmisNote: hmisNoteId || null,
            },
          },
        });
      }
      refetch?.();
    } catch (err) {
      showSnackbar({ message: 'Failed to save task', type: 'error' });
    }
  };

  const handleLiveDelete = async (id: string) => {
    try {
      await deleteTask({
        variables: { id },
      });
      refetch?.();
      showSnackbar({ message: 'Task deleted', type: 'success' });
      // We often need to close the modal manually if the delete action originated from within it
      closeModalScreen();
    } catch (err) {
      showSnackbar({ message: 'Failed to delete task', type: 'error' });
    }
  };

  const onSave = (data: TaskFormData, existingId?: string) => {
    if (isDraftMode) return handleDraftSave(data, existingId);
    return handleLiveSave(data, existingId);
  };

  const openModal = (taskToEdit?: UpdateTaskInput | LocalDraftTask) => {
    const taskProp = taskToEdit
      ? ({
          id: taskToEdit.id,
          summary: taskToEdit.summary,
          description: taskToEdit.description || undefined,
          status: taskToEdit.status,
          team: taskToEdit.team,
        } as UpdateTaskInput)
      : undefined;

    showModalScreen({
      presentation: 'fullScreenModal',
      hideHeader: true,
      content: (
        <NoteTasksModal
          clientProfileId={clientProfileId}
          hmisClientProfileId={hmisClientProfileId}
          noteId={noteId}
          hmisNoteId={hmisNoteId}
          task={taskProp}
          team={team}
          // ESLint Fix: async fallback
          refetch={refetch || (async () => undefined)}
          // Unified Submit Handler
          onSubmit={(data) => onSave(data, taskToEdit?.id)}
          // Unified Delete Handler (Show button if ID exists, regardless of mode)
          onDelete={
            taskToEdit?.id
              ? () => {
                  if (isDraftMode) {
                    handleDraftDelete(taskToEdit.id as string);
                  } else {
                    handleLiveDelete(taskToEdit.id as string);
                  }
                }
              : undefined
          }
        />
      ),
    });
  };

  // 1. View Mode Logic: If hideIfEmpty is true AND no tasks, render nothing.
  if (hideIfEmpty && tasks.length === 0) {
    return null;
  }

  // 2. Logic: If no tasks, show the card (in Edit/Create modes), but NO header action.
  const actionName = '';

  return (
    <FieldCard
      scrollRef={scrollRef}
      mb="xs"
      actionName={actionName}
      title="Follow-Up Tasks"
      setExpanded={() => {
        // If the list is empty, clicking the header/card opens the Add Modal
        if (!tasks.length) openModal();
      }}
    >
      <View style={{ gap: Spacings.xs }}>
        {tasks.map((item, index) => (
          <CTAButton
            key={item.id || index}
            onPress={() => openModal(item)}
            label={item.summary || 'Untitled Task'}
          />
        ))}
      </View>

      {/* 3. Bottom Button: ONLY show if we have at least 1 task */}
      {tasks.length > 0 && (
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
