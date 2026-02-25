import {
  BottomActions,
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
