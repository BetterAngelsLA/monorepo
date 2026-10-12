import { act, render, waitFor } from '@testing-library/react-native';
import { Avatar } from './Avatar';

// The source handed to expo-image is where the fix lives, so capture it.
type CapturedProps = {
  source?: { uri?: string; cacheKey?: string };
  onError?: () => void;
};
const { imageProps } = vi.hoisted(() => ({
  imageProps: [] as CapturedProps[],
}));

vi.mock('expo-image', () => ({
  Image: (props: CapturedProps) => {
    imageProps.push(props);
    return null;
  },
}));

const PATH =
  'https://cdn.dev.betterangels.la/imgproxy/abc123/rs:force:0:0/xyz.jpg';
const signed = (signature: string) => `${PATH}?Policy=${signature}`;

const lastSource = () => imageProps[imageProps.length - 1].source;

describe('Avatar', () => {
  beforeEach(() => {
    imageProps.length = 0;
  });

  it('keeps the URI it renders while only the signature changes', async () => {
    const { rerender } = await render(<Avatar imageUrl={signed('one')} />);
    rerender(<Avatar imageUrl={signed('two')} />);

    // A re-signed URI is the same photo: rendering it would reload and paint
    // blank first, which is the flicker.
    expect(lastSource()?.uri).toBe(signed('one'));
    expect(lastSource()?.cacheKey).toBe(PATH);
  });

  it('adopts the new URI when the photo itself changes', async () => {
    const other = signed('one').replace('xyz.jpg', 'other.jpg');
    const { rerender } = await render(<Avatar imageUrl={signed('one')} />);
    await rerender(<Avatar imageUrl={other} />);

    await waitFor(() => expect(lastSource()?.uri).toBe(other));
  });

  it('falls back to the latest URI when the held one fails to load', async () => {
    const { rerender } = await render(<Avatar imageUrl={signed('one')} />);
    await rerender(<Avatar imageUrl={signed('two')} />);

    await act(async () => {
      imageProps[imageProps.length - 1].onError?.();
    });

    // The held signature can age out while the screen stays mounted.
    await waitFor(() => expect(lastSource()?.uri).toBe(signed('two')));
  });
});
