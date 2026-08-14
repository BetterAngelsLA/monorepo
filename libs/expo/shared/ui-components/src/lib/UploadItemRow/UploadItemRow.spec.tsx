import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { UploadItemRow } from './UploadItemRow';

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
}));

vi.mock('../TextButton', () => ({
  __esModule: true,
  default: ({
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

vi.mock('../TextRegular', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

describe('UploadItemRow', () => {
  it('renders an uploading item with progress percentage and a Cancel action', () => {
    const onCancel = vi.fn();
    const { getByText, queryByText } = render(
      <UploadItemRow
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
  });

  it('shows the queued label for a pending item without progress', () => {
    const { getByText } = render(
      <UploadItemRow filename="a.pdf" status="pending" />,
    );

    expect(getByText('Queued')).toBeTruthy();
    expect(getByText('a.pdf')).toBeTruthy();
  });

  it('fires onCancel from the row', () => {
    const onCancel = vi.fn();
    const { getByText } = render(
      <UploadItemRow filename="a.pdf" status="pending" onCancel={onCancel} />,
    );

    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a Retry action for a failed item and no Cancel', () => {
    const onRetry = vi.fn();
    const { getByText, queryByText } = render(
      <UploadItemRow filename="a.pdf" status="error" onRetry={onRetry} />,
    );

    expect(getByText('Failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();

    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows Done for a finished item without actions', () => {
    const { getByText, queryByText } = render(
      <UploadItemRow filename="a.pdf" status="done" />,
    );

    expect(getByText('Done')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
    expect(queryByText('Retry')).toBeNull();
  });

  it('clamps the progress percentage to 100', () => {
    const { getByText } = render(
      <UploadItemRow filename="a.pdf" status="uploading" progressPct={125} />,
    );

    expect(getByText('100%')).toBeTruthy();
  });
});
