import { ViewTaskQuery } from '@monorepo/expo/betterangels';
import { FieldCard, TextMedium } from '@monorepo/expo/shared/ui-components';
import { RefObject, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import TitleInput from './TitleInput';

interface ITitleProps {
  expanded: string | undefined | null;
  setExpanded: (expanded: string | undefined | null) => void;
  taskId: string | undefined;
  title: ViewTaskQuery['task']['title'];
  scrollRef: RefObject<ScrollView>;
}

export default function Title(props: ITitleProps) {
  const { expanded, setExpanded, taskId, title, scrollRef } = props;
  const [hasError, setHasError] = useState({ error: false, check: false });
  const isTitle = expanded === 'Title';

  useEffect(() => {
    if (!isTitle) {
      if (hasError.check && !title) {
        setHasError({ error: true, check: true });
      }
    } else {
      setHasError({ error: false, check: true });
    }
  }, [expanded]);

  return (
    <FieldCard
      scrollRef={scrollRef}
      expanded={expanded}
      setExpanded={() => {
        setExpanded(isTitle ? null : 'Title');
      }}
      error={
        hasError.check && hasError.error && !isTitle
          ? `Please enter a title for this task`
          : undefined
      }
      required
      mb="xs"
      actionName={
        !title && !isTitle ? <TextMedium size="sm">Add Title</TextMedium> : ''
      }
      title="Title"
    >
      <View
        style={{
          height: isTitle ? 'auto' : 0,
          overflow: 'hidden',
        }}
      >
        <TitleInput
          taskId={taskId}
          initialTitle={title}
          hasError={hasError.check && hasError.error}
        />
      </View>
    </FieldCard>
  );
}
