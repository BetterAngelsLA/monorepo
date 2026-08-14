import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  failUploadSession,
  resetUploadProgressAtoms,
  setUploadStageVisible,
  startUploadSession,
  updateUploadSession,
} from '../../providers/uploadProgress';
import { UploadProgressBar } from './UploadProgressBar';

const mocks = vi.hoisted(() => ({
  showModalScreen: vi.fn(),
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'bar-session',
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextRegular: ({ children }: { children: React.ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

vi.mock('../../providers', () => ({
  useModalScreen: () => ({ showModalScreen: mocks.showModalScreen }),
}));

vi.mock('../../screens/Client/Docs/UploadStage/UploadStage', () => ({
  __esModule: true,
  default: () => <Text>UploadStage</Text>,
}));

describe('UploadProgressBar', () => {
  beforeEach(() => {
    resetUploadProgressAtoms();
    mocks.showModalScreen.mockClear();
  });

  afterEach(() => {
    resetUploadProgressAtoms();
  });

  it('renders nothing when there are no active sessions', () => {
    const { toJSON } = render(<UploadProgressBar />);

    expect(toJSON()).toBeNull();
  });

  it('shows the aggregate progress of background sessions', () => {
    startUploadSession('s1', ['a.pdf', 'b.pdf'], { clientId: 'client-1' });
    updateUploadSession('s1', {
      stage: 'UPLOADING',
      completed: 1,
      total: 2,
    });

    const { getByText } = render(<UploadProgressBar />);

    expect(getByText('Uploading 1 of 2 files…')).toBeTruthy();
  });

  it('opens the upload screen in resume mode when tapped', () => {
    startUploadSession('s1', ['a.pdf'], { clientId: 'client-1' });

    const { getByLabelText } = render(<UploadProgressBar />);

    fireEvent.press(getByLabelText('Uploading 0 of 1 files…'));

    expect(mocks.showModalScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        presentation: 'fullScreenModal',
        title: 'Uploads',
      }),
    );

    const options = mocks.showModalScreen.mock.calls[0][0];
    const modal = render(options.renderContent({ close: vi.fn() }));
    expect(modal.getByText('UploadStage')).toBeTruthy();
  });

  it('shows the failure state for failed sessions', () => {
    startUploadSession('s1', ['a.pdf'], { clientId: 'client-1' });
    failUploadSession('s1', 'boom');

    const { getByText } = render(<UploadProgressBar />);

    expect(getByText('Upload failed — tap to review')).toBeTruthy();
  });

  it('hides while the upload screen is open', () => {
    startUploadSession('s1', ['a.pdf'], { clientId: 'client-1' });
    setUploadStageVisible(true);

    const { toJSON } = render(<UploadProgressBar />);

    expect(toJSON()).toBeNull();
  });
});
