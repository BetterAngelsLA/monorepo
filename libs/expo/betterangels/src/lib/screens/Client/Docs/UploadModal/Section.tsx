import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  IconButton,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { ScrollView } from 'react-native';
import { ISectionProps } from './types';

export default function Section(props: ISectionProps) {
  const { setTab, title, subtitle, onSubmit } = props;
  return (
    <>
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          flex: 1,
        }}
      >
        <IconButton
          onPress={() => setTab(undefined)}
          mb="sm"
          accessibilityHint="closes the modal"
          accessibilityLabel="close"
          variant={'secondary'}
          borderColor="transparent"
        >
          <ChevronLeftIcon size="sm" />
        </IconButton>
        <TextBold size="lg">{title}</TextBold>
        <TextRegular size="sm" mb="md">
          {subtitle}
        </TextRegular>
      </ScrollView>
      <BottomActions
        cancel={
          <TextButton
            title="Cancel"
            onPress={() => setTab(undefined)}
            accessibilityHint="Cancel upload"
          />
        }
        onSubmit={onSubmit}
      />
    </>
  );
}
