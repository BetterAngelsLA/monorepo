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
import { IUploadSectionProps } from './types';

export default function UploadSection(props: IUploadSectionProps) {
  const { onCancel, title, subtitle, onSubmit, children, loading, disabled } =
    props;

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
          onPress={onCancel}
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
        isLoading={loading}
        disabled={disabled}
        cancel={
          <TextButton
            title="Cancel"
            onPress={onCancel}
            accessibilityHint="Cancel upload"
          />
        }
        onSubmit={onSubmit}
      />
    </KeyboardAvoidingView>
  );
}
