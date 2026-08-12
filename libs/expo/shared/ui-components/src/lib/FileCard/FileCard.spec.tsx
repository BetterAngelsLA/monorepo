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

  it('renders an uploading row with progress percentage and a Cancel action', () => {
    const onCancel = vi.fn();
    const { getByText, queryByText } = render(
      <FileCard
        filename="a.pdf"
        status="uploading"
        progressPct={42}
        onCancel={onCancel}
      />,
    );

    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('42%')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(queryByText('Retry')).toBeNull();
    // Upload rows show progress, not a created date.
    expect(queryByText(FORMATTED_DATE)).toBeNull();
  });

  it('fires onCancel from the upload row', () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <FileCard filename="a.pdf" status="pending" onCancel={onCancel} />,
    );

    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a Retry action for a failed upload', () => {
    const onRetry = vi.fn();
    const { getByText, queryByText } = render(
      <FileCard filename="a.pdf" status="error" onRetry={onRetry} />,
    );

    expect(getByText('Failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();

    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('clamps the progress percentage to 100', () => {
    const { getByText } = render(
      <FileCard filename="a.pdf" status="uploading" progressPct={125} />,
    );

    expect(getByText('100%')).toBeTruthy();
  });
});
