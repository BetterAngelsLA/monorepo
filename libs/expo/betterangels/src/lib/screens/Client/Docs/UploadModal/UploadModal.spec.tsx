import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import UploadModal from './index';

const mocks = vi.hoisted(() => ({
  uploadStageProps: [] as Array<Record<string, unknown>>,
  mediaPickerProps: [] as Array<{
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }>,
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../UploadStage/UploadStage', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mocks.uploadStageProps.push(props);

    return <Text>UploadStage</Text>;
  },
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  MediaPicker: (props: {
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }) => {
    mocks.mediaPickerProps.push(props);

    return null;
  },
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
  TextButton: ({
    title,
    onPress,
    accessibilityHint,
  }: {
    title: string;
    onPress?: () => void;
    accessibilityHint?: string;
  }) => (
    <Text
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    >
      {title}
    </Text>
  ),
  Button: ({
    title,
    onPress,
    accessibilityHint,
  }: {
    title: string;
    onPress?: () => void;
    accessibilityHint?: string;
  }) => (
    <Text
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    >
      {title}
    </Text>
  ),
}));

const client = {
  clientProfile: { id: 'client-1', docReadyDocuments: [] },
} as unknown as ClientProfileQuery;

const sampleFile = {
  name: 'consent.pdf',
  type: 'application/pdf',
  uri: 'file://consent.pdf',
};

function renderModal(overrides?: { closeModal?: () => void }) {
  return render(
    <UploadModal
      client={client}
      closeModal={overrides?.closeModal ?? vi.fn()}
    />,
  );
}

async function selectFiles(files: unknown[]) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  await act(async () => {
    latest.onFilesSelected?.(files);
  });
}

describe('UploadModal', () => {
  beforeEach(() => {
    mocks.uploadStageProps = [];
    mocks.mediaPickerProps = [];
  });

  it('is a pure picker: nothing uploads until files are picked', () => {
    const { queryByText, getByText } = renderModal();

    expect(queryByText('UploadStage')).toBeNull();
    // The picker is visible with its doc-type rows.
    expect(getByText('Consent Forms')).toBeTruthy();
  });

  it('hands the picked files to the upload stage for review instead of uploading immediately', async () => {
    const closeModal = vi.fn();

    const { getByText } = renderModal({ closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.uploadStageProps).toHaveLength(1);
    expect(mocks.uploadStageProps[0].clientProfileId).toBe('client-1');
    expect(mocks.uploadStageProps[0].selection).toEqual({
      namespace: ClientDocumentNamespaceEnum.ConsentForm,
      title: 'Consent Forms',
      files: [sampleFile],
    });
    // The form stays open; the stage takes over the same modal.
    expect(closeModal).not.toHaveBeenCalled();
    expect(getByText('UploadStage')).toBeTruthy();
  });

  it('passes the same closeModal through to the upload stage', async () => {
    const closeModal = vi.fn();

    const { getByText } = renderModal({ closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.uploadStageProps[0].closeModal).toBe(closeModal);
  });

  it('closes the form when Done is pressed', () => {
    const closeModal = vi.fn();

    const { getByLabelText } = renderModal({ closeModal });

    fireEvent.press(getByLabelText('Done'));
    expect(closeModal).toHaveBeenCalled();
  });
});
