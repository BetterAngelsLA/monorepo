import { useUpdateTaskMutation } from '@monorepo/expo/betterangels';
import { BasicInput } from '@monorepo/expo/shared/ui-components';
import { debounce } from '@monorepo/expo/shared/utils';
import { useRef, useState } from 'react';

interface ITitleProps {
  initialTitle: string;
  hasError: boolean;
  taskId: string | undefined;
}

export default function TitleInput(props: ITitleProps) {
  const { initialTitle, hasError, taskId } = props;
  const [title, setTitle] = useState(initialTitle);
  const [updateTask, { error, loading }] = useUpdateTaskMutation();

  const updateTaskFunction = useRef(
    debounce(async (title: string) => {
      if (!taskId) return;
      try {
        const { data } = await updateTask({
          variables: {
            data: {
              id: taskId,
              title,
            },
          },
        });
        if (!data) {
          console.log('Error updating task', error);
        }
      } catch (err) {
        console.error('Error updating task:', err);
      }
    }, 500)
  ).current;

  const onChange = (value: string) => {
    if (loading) return;
    setTitle(value);
    updateTaskFunction(value);
  };

  const onDelete = () => {
    if (loading) return;
    setTitle('');
    // updateTaskFunction('');
  };

  return (
    <BasicInput
      onDelete={onDelete}
      placeholder="Enter a title"
      mt="xs"
      error={hasError}
      value={title}
      onChangeText={onChange}
    />
  );
}
