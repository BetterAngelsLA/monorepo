import { act, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { HmisClientProfileType } from '../../../../apollo';
import UploadModalHmis from './UploadModalHmis';

const mocks = vi.hoisted(() => {
  class MockErrorHmis extends Error {
    status: number;
    data?: unknown;

    constructor(message: string, status: number, data?: unknown) {
      super(message);
      this.name = 'ErrorHmis';
      this.status = status;
      this.data = data;
    }
  }

  class MockInvalidFileTypeErrorHmis extends MockErrorHmis {
    constructor(message: string, status: number, data?: unknown) {
      super(message, status, data);
      this.name = 'InvalidFileTypeErrorHmis';
    }
  }

  return {
    uploadClientFile: vi.fn(),
    invalidateQueries: vi.fn(),
    startUpload: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: vi.fn(),
    endUpload: vi.fn(),
    readFileAsBase64: vi.fn(),
    ErrorHmis: MockErrorHmis,
    InvalidFileTypeErrorHmis: MockInvalidFileTypeErrorHmis,
    selectorProps: [] as Array<{ onSelect: (selection: unknown) => void }>,
    mediaPickerProps: [] as Array<{
      isOpen: boolean;
      onFilesSelected?: (files: unknown[]) => void;
      onCameraCapture?: (file: unknown) => void;
    }>,
    formPageProps: [] as Array<{
      actionProps?: {
        onSubmit: () => Promise<void>;
        onLeftBtnClick: () => void;
        disabled?: boolean;
      };
    }>,
  };
});

vi.mock('expo-crypto', () => ({ randomUUID: () => 'session-hmis' }));

// The clients barrel pulls in expo-modules-core, which vitest-native cannot
// strip; provide the error classes used by toErrorMessage directly.
vi.mock('@monorepo/expo/shared/clients', () => ({
  ErrorHmis: mocks.ErrorHmis,
  InvalidFileTypeErrorHmis: mocks.InvalidFileTypeErrorHmis,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Form: {
    Page: (props: {
      actionProps?: {
        onSubmit: () => Promise<void>;
        onLeftBtnClick: () => void;
        disabled?: boolean;
      };
      children: ReactNode;
    }) => {
      mocks.formPageProps.push(props);

      return <View>{props.children}</View>;
    },
  },
  LoadingView: () => null,
  MediaPicker: (props: {
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }) => {
    mocks.mediaPickerProps.push(props);

    return null;
  },
}));

vi.mock('@monorepo/expo/shared/utils', () => ({
  readFileAsBase64: mocks.readFileAsBase64,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('../../../../hooks', () => ({
  useClientHmis: () => ({ uploadClientFile: mocks.uploadClientFile }),
  useFileCategoryAndNamesHmis: () => ({
    categories: [{ id: '1', name: 'Category A' }],
    fileNames: { '1': [{ id: '2', name: 'Predefined' }] },
    error: null,
    loading: false,
  }),
}));

vi.mock('../../../../hooks/fileMetadataHmis/useClientFiles', () => ({
  getClientFilesQueryKey: () => ['hmis-files'],
}));

vi.mock('../../../../providers', () => ({
  useUploadProgress: () => ({
    sessions: [],
    startUpload: mocks.startUpload,
    setUploadManifest: vi.fn(),
    updateUpload: mocks.updateUpload,
    failUpload: mocks.failUpload,
    endUpload: mocks.endUpload,
    cancelUpload: vi.fn(),
  }),
}));

vi.mock('../../../../ui-components', () => ({
  FileUploadsPreview: () => null,
}));

vi.mock('./FileCategorySelector', () => ({
  FileCategorySelector: (props: { onSelect: (selection: unknown) => void }) => {
    mocks.selectorProps.push(props);

    return null;
  },
}));

const client = {
  id: 'c1',
  hmisId: 'hmis1',
  uniqueIdentifier: 'U-123',
} as unknown as HmisClientProfileType;

const sampleFile = {
  uri: 'file://doc.pdf',
  name: 'doc.pdf',
  type: 'application/pdf',
};

function renderModal(closeModal = vi.fn()) {
  return render(<UploadModalHmis client={client} closeModal={closeModal} />);
}

function selectCategory(selection: unknown) {
  const latest = mocks.selectorProps[mocks.selectorProps.length - 1];

  act(() => {
    latest.onSelect(selection);
  });
}

async function selectFile(file: unknown) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  await act(async () => {
    latest.onFilesSelected?.([file]);
  });
}

async function submit() {
  const latest = mocks.formPageProps[mocks.formPageProps.length - 1];

  await act(async () => {
    await latest.actionProps?.onSubmit();
  });
}

describe('UploadModalHmis', () => {
  beforeEach(() => {
    mocks.uploadClientFile.mockReset();
    mocks.readFileAsBase64.mockResolvedValue('base64data');
    mocks.invalidateQueries.mockClear();
    mocks.startUpload.mockClear();
    mocks.updateUpload.mockClear();
    mocks.failUpload.mockClear();
    mocks.endUpload.mockClear();
    mocks.selectorProps.length = 0;
    mocks.mediaPickerProps.length = 0;
    mocks.formPageProps.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads the file, drives the drawer session, and closes on success', async () => {
    mocks.uploadClientFile.mockResolvedValue({ id: 'file-1' });
    const closeModal = vi.fn();

    renderModal(closeModal);
    selectCategory({
      type: 'predefined',
      categoryId: '1',
      subCategoryId: '2',
      categoryName: 'Category A',
    });
    await selectFile(sampleFile);
    await submit();

    expect(mocks.readFileAsBase64).toHaveBeenCalledWith('file://doc.pdf');
    expect(mocks.uploadClientFile).toHaveBeenCalledWith({
      clientId: 'U-123',
      file: {
        content: 'base64data',
        name: 'doc.pdf',
        mimeType: 'application/pdf',
      },
      categoryId: 1,
      fileNameId: 2,
      customFileName: undefined,
      isPrivate: false,
    });
    expect(mocks.startUpload).toHaveBeenCalledWith('session-hmis', ['doc.pdf']);
    expect(mocks.updateUpload).toHaveBeenCalledWith('session-hmis', {
      stage: 'UPLOADING',
      completed: 0,
      total: 1,
    });
    expect(mocks.endUpload).toHaveBeenCalledWith('session-hmis');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['hmis-files'],
    });
    expect(closeModal).toHaveBeenCalled();
  });

  it('marks the session failed with the specific file-type message on error', async () => {
    mocks.uploadClientFile.mockRejectedValue(
      new mocks.InvalidFileTypeErrorHmis('Invalid file type', 400, {
        received: 'text/plain',
      }),
    );
    const closeModal = vi.fn();

    renderModal(closeModal);
    selectCategory({
      type: 'predefined',
      categoryId: '1',
      subCategoryId: '2',
      categoryName: 'Category A',
    });
    await selectFile(sampleFile);
    await submit();

    expect(mocks.failUpload).toHaveBeenCalledWith(
      'session-hmis',
      'Sorry, file type "text/plain" is not supported.',
    );
    expect(closeModal).not.toHaveBeenCalled();
    expect(mocks.endUpload).not.toHaveBeenCalled();
  });

  it('maps a 401 to the session-expired message', async () => {
    mocks.uploadClientFile.mockRejectedValue(new mocks.ErrorHmis('expired', 401));
    const closeModal = vi.fn();

    renderModal(closeModal);
    selectCategory({
      type: 'predefined',
      categoryId: '1',
      subCategoryId: '2',
      categoryName: 'Category A',
    });
    await selectFile(sampleFile);
    await submit();

    expect(mocks.failUpload).toHaveBeenCalledWith(
      'session-hmis',
      'Your HMIS session has expired. Please log in again.',
    );
  });

  it('does not start a session when validation fails before upload', async () => {
    const closeModal = vi.fn();

    renderModal(closeModal);
    selectCategory({
      type: 'custom',
      categoryId: '1',
      categoryName: 'Category A',
      fileName: '',
    });
    await selectFile(sampleFile);
    await submit();

    // Missing custom filename for subcategory 0 throws before startUpload.
    expect(mocks.startUpload).not.toHaveBeenCalled();
    expect(mocks.failUpload).not.toHaveBeenCalled();
    expect(closeModal).not.toHaveBeenCalled();
  });
});
