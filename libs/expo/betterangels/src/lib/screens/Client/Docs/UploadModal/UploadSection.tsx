import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import {
  BottomActions,
  IconButton,
  TextBold,
  TextButton,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';
import { MainScrollContainer } from '../../../../ui-components';
import { IUploadSectionProps } from './types';

export function UploadSection(props: IUploadSectionProps) {
  const { onCancel, title, subtitle, onSubmit, children, loading, disabled } =
    props;

  return (
    <View style={{ flex: 1 }}>
      <MainScrollContainer keyboardAware>
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
      </MainScrollContainer>

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
    </View>
  );
}
