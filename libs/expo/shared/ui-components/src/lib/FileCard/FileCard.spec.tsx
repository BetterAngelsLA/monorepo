import { fireEvent, render } from '@testing-library/react-native';
import { FileCard } from './FileCard';

vi.mock('expo-image', () => ({
  Image: () => null,
}));

const FORMATTED_DATE = '08/01/2026';

describe('FileCard', () => {
  it('renders a completed document row with its formatted date', () => {
    const { getByText, queryByText } = render(
      <FileCard
        filename="consent.pdf"
        url="https://example.com/doc.pdf"
        createdAt="2026-08-01T12:00:00.000Z"
        onPress={() => undefined}
      />,
    );

    expect(getByText('consent.pdf')).toBeTruthy();
    expect(getByText(FORMATTED_DATE)).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
    expect(queryByText('Retry')).toBeNull();
  });

  it('opens on press for a completed document', () => {
    const onPress = vi.fn();
    const { getByText } = render(
      <FileCard
        filename="a.pdf"
        url="u"
        createdAt="2026-08-01T12:00:00.000Z"
        onPress={onPress}
      />,
    );

    fireEvent.press(getByText('a.pdf'));
    expect(onPress).toHaveBeenCalled();
  });

  it('exposes a disabled state when disabled', () => {
    const { getByLabelText } = render(
      <FileCard
        filename="a.pdf"
        url="u"
        createdAt="2026-08-01T12:00:00.000Z"
        onPress={() => undefined}
        disabled
      />,
    );

    expect(
      getByLabelText('open document modal').props.accessibilityState,
    ).toEqual({ disabled: true });
  });
});
