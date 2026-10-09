import { renderHook } from '@testing-library/react-native';
import { useCapturePicture } from './useCapturePicture';

const mocks = vi.hoisted(() => ({
  takePictureAsync: vi.fn(),
  resizeImage: vi.fn(),
}));

vi.mock('expo-camera', () => ({
  CameraView: class {},
  ImageType: { jpg: 'jpg' },
}));

// The simulator-mock branch is the only place this hook touches
// expo-file-system, and it is unreachable unless shouldMockCamera is true.
vi.mock('expo-file-system', () => ({
  File: class {},
  Paths: { cache: '/cache' },
}));

vi.mock('@monorepo/expo/shared/utils', () => ({
  resizeImage: mocks.resizeImage,
}));

vi.mock('@monorepo/expo/shared/clients', () => ({
  ReactNativeFile: class {
    uri: string;
    name: string;
    type: string;
    constructor(props: { uri: string; name: string; type: string }) {
      this.uri = props.uri;
      this.name = props.name;
      this.type = props.type;
    }
  },
}));

vi.mock('./utils', () => ({ shouldMockCamera: false }));

type CaptureResult = Awaited<
  ReturnType<ReturnType<typeof useCapturePicture>['capture']>
>;

const cameraRef = (takePictureAsync: () => unknown) =>
  ({ current: { takePictureAsync } }) as never;

describe('useCapturePicture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Width/height are only used for logging/scale decisions downstream.
    mocks.resizeImage.mockResolvedValue({ uri: 'file:///resized.jpg' });
  });

  it('builds a ReactNativeFile from the captured and resized photo', async () => {
    mocks.takePictureAsync.mockResolvedValue({
      uri: 'data:image/jpeg;base64,AAAA',
      width: 100,
      height: 100,
    });

    const { result } = await renderHook(() =>
      useCapturePicture({ imageType: 'jpg' }),
    );
    const outcome = (await result.current.capture(
      cameraRef(mocks.takePictureAsync),
    )) as CaptureResult;

    expect(outcome.type).toBe('success');
    if (outcome.type !== 'success') return;

    // The web camera returns a data URL; the resized uri is what we upload.
    expect(mocks.resizeImage).toHaveBeenCalledWith({
      uri: 'data:image/jpeg;base64,AAAA',
    });
    expect(outcome.file.uri).toBe('file:///resized.jpg');
    expect(outcome.file.type).toBe('image/jpeg');
    expect(outcome.file.name).toMatch(/\.jpg$/);
  });

  it('reports a cancel when the camera yields nothing', async () => {
    mocks.takePictureAsync.mockResolvedValue(null);

    const { result } = await renderHook(() =>
      useCapturePicture({ imageType: 'jpg' }),
    );
    const outcome = (await result.current.capture(
      cameraRef(mocks.takePictureAsync),
    )) as CaptureResult;

    expect(outcome.type).toBe('cancel');
    expect(mocks.resizeImage).not.toHaveBeenCalled();
  });

  it('errors when the camera is not mounted yet', async () => {
    const { result } = await renderHook(() =>
      useCapturePicture({ imageType: 'jpg' }),
    );
    const outcome = (await result.current.capture({
      current: null,
    } as never)) as CaptureResult;

    expect(outcome.type).toBe('error');
  });

  it('errors rather than throwing when capture fails', async () => {
    mocks.takePictureAsync.mockRejectedValue(new Error('camera busy'));

    const { result } = await renderHook(() =>
      useCapturePicture({ imageType: 'jpg' }),
    );
    const outcome = (await result.current.capture(
      cameraRef(mocks.takePictureAsync),
    )) as CaptureResult;

    expect(outcome.type).toBe('error');
  });
});
