import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import {
  BottomActions,
  IconButton,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ISectionProps } from './types';

export default function Section(props: ISectionProps) {
  const { setTab, title, subtitle, onSubmit, children } = props;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{
          paddingHorizontal: Spacings.sm,
          flex: 1,
        }}
        contentContainerStyle={{ paddingBottom: Spacings.xl }}
      >
        <IconButton
          onPress={() => setTab(undefined)}
          mb="sm"
          accessibilityHint="closes the modal"
          accessibilityLabel="close"
          alignItems="flex-start"
          variant={'transparent'}
          borderColor="transparent"
        >
          <ChevronLeftIcon size="sm" />
        </IconButton>
        <TextBold size="lg">{title}</TextBold>
        <TextRegular size="sm" mb="sm">
          {subtitle}
        </TextRegular>
        {children}
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
    </KeyboardAvoidingView>
  );
}
