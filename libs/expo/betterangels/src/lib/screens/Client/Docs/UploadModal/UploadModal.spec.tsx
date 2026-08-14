import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import UploadModal from './index';

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
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

vi.mock('../UploadStage/useDocsUpload', () => ({
  useDocsUpload: () => ({ startSession: mocks.startSession }),
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

const secondFile = {
  name: 'consent-2.pdf',
  type: 'application/pdf',
  uri: 'file://consent-2.pdf',
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
    mocks.startSession.mockClear();
    mocks.mediaPickerProps = [];
  });

  it('is a pure picker: nothing uploads until files are picked', () => {
    const { getByText } = renderModal();

    expect(getByText('Consent Forms')).toBeTruthy();
    expect(mocks.startSession).not.toHaveBeenCalled();
  });

  it('starts the upload immediately and closes the form', async () => {
    const closeModal = vi.fn();

    const { getByText } = renderModal({ closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.startSession).toHaveBeenCalledWith(
      [sampleFile],
      ClientDocumentNamespaceEnum.ConsentForm,
      'Consent Forms',
    );
    expect(closeModal).toHaveBeenCalled();
  });

  it('passes every picked file for multi-file doc types', async () => {
    const { getByText } = renderModal();

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile, secondFile]);

    expect(mocks.startSession).toHaveBeenCalledWith(
      [sampleFile, secondFile],
      ClientDocumentNamespaceEnum.ConsentForm,
      'Consent Forms',
    );
  });

  it('closes the form when Done is pressed', () => {
    const closeModal = vi.fn();

    const { getByLabelText } = renderModal({ closeModal });

    fireEvent.press(getByLabelText('Done'));
    expect(closeModal).toHaveBeenCalled();
  });
});
