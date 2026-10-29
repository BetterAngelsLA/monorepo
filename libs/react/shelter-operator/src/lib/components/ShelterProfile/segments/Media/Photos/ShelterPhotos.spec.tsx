import { fireEvent, render, screen } from '@testing-library/react';
import type { ShelterProfilePhotoType } from '../../../types';
import { ShelterPhotos } from './ShelterPhotos';

const mocks = vi.hoisted(() => ({
  canEditShelter: false,
  showToast: vi.fn(),
}));

vi.mock('../../../../../hooks', () => ({
  useShelterPermissions: () => ({ canEditShelter: mocks.canEditShelter }),
}));

vi.mock('../../../../base-ui/toast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

// jsdom does not implement <dialog>.showModal(); only the open/closed state
// matters for these cases.
vi.mock('../../../../base-ui/modal', () => ({
  Modal: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
  ModalHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ModalBody: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/ThumbImg', () => ({
  ThumbImg: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('./components/ToggleHeroShelterImageBtn', () => ({
  ToggleHeroShelterImageBtn: ({ photoId }: { photoId: string }) => (
    <button>hero {photoId}</button>
  ),
}));

vi.mock('./components/EditShelterPhoto', () => ({
  EditShelterPhoto: ({ photoId }: { photoId: string }) => (
    <button>edit {photoId}</button>
  ),
}));

vi.mock('./components/DeleteShelterImage', () => ({
  DeleteShelterImage: ({ photoId }: { photoId: string }) => (
    <button>delete {photoId}</button>
  ),
}));

vi.mock('./components/ShelterImagesUpload', () => ({
  ShelterImagesUpload: ({ onError }: { onError: (error: Error) => void }) => (
    <button onClick={() => onError(new Error('boom'))}>fail upload</button>
  ),
}));

const photo = (
  id: string,
  overrides: { name?: string; type?: string } = {},
): ShelterProfilePhotoType =>
  ({
    id,
    type: overrides.type ?? 'EXTERIOR',
    file: {
      name: overrides.name ?? `uploads/${id}.jpg`,
      urlThumb: `thumb-${id}`,
      urlLg: `lg-${id}`,
    },
  }) as unknown as ShelterProfilePhotoType;

const renderPhotos = (photos: ShelterProfilePhotoType[] = [photo('p1')]) =>
  render(
    <ShelterPhotos photos={photos} shelterId="shelter-1" heroImageId="p1" />,
  );

describe('ShelterPhotos', () => {
  beforeEach(() => {
    mocks.canEditShelter = false;
    mocks.showToast.mockClear();
  });

  it('lists the files by last path segment and type', () => {
    renderPhotos([photo('p1', { name: 'uploads/Hero.JPG' })]);

    expect(screen.getByText('hero.jpg')).toBeTruthy();
    expect(screen.getByText('exterior')).toBeTruthy();
  });

  it('omits the actions column without edit permission', () => {
    renderPhotos();

    expect(screen.queryByText('Actions')).toBeNull();
    expect(screen.queryByRole('button', { name: /^hero/ })).toBeNull();
  });

  it('renders per-photo actions with edit permission', () => {
    mocks.canEditShelter = true;

    renderPhotos();

    expect(screen.getByText('Actions')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'hero p1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'edit p1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete p1' })).toBeTruthy();
  });

  it('hides the upload button without edit permission', () => {
    renderPhotos();

    expect(screen.queryByRole('button', { name: /Upload Image/ })).toBeNull();
  });

  it('opens the upload modal from the upload button', () => {
    mocks.canEditShelter = true;

    renderPhotos();

    expect(screen.queryByTestId('modal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Upload Image/ }));

    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByText('Upload Images')).toBeTruthy();
  });

  it('closes the modal and reports an upload error', () => {
    mocks.canEditShelter = true;

    renderPhotos();

    fireEvent.click(screen.getByRole('button', { name: /Upload Image/ }));
    fireEvent.click(screen.getByRole('button', { name: 'fail upload' }));

    expect(screen.queryByTestId('modal')).toBeNull();
    expect(mocks.showToast).toHaveBeenCalledWith({
      status: 'error',
      title: 'Upload failed',
      description: 'boom',
      persistent: true,
    });
  });
});
