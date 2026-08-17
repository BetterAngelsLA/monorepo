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

  it('offers both Retry and Dismiss for a failed item', () => {
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    const { getByText, queryByText } = render(
      <UploadItemRow
        filename="a.pdf"
        status="error"
        onRetry={onRetry}
        onCancel={onCancel}
      />,
    );

    expect(getByText('Failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    // A failed row must be clearable: retry can keep failing, and a session
    // that can never be emptied pins the global progress bar in its error
    // state for the rest of the app session.
    expect(getByText('Dismiss')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();

    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();

    fireEvent.press(getByText('Dismiss'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('labels the in-flight removal Cancel and the settled one Dismiss', () => {
    const uploading = render(
      <UploadItemRow
        filename="a.pdf"
        status="uploading"
        onCancel={vi.fn()}
      />,
    );
    expect(uploading.getByText('Cancel')).toBeTruthy();

    const failed = render(
      <UploadItemRow filename="a.pdf" status="error" onCancel={vi.fn()} />,
    );
    expect(failed.getByText('Dismiss')).toBeTruthy();
  });

  it('shows a saving label once the bytes are up but not yet persisted', () => {
    const { getByText, queryByText } = render(
      <UploadItemRow filename="a.pdf" status="uploaded" onCancel={vi.fn()} />,
    );

    // Not "Done": the file is in S3 but has no document record yet.
    expect(getByText('Saving…')).toBeTruthy();
    expect(queryByText('Done')).toBeNull();
  });

  it('keeps the row actions reachable to screen readers', () => {
    const { getByLabelText } = render(
      <UploadItemRow
        filename="a.pdf"
        status="error"
        onRetry={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // `accessible` on the row container would collapse these into the
    // status label on iOS and make them unreachable.
    expect(getByLabelText('Retry')).toBeTruthy();
    expect(getByLabelText('Dismiss')).toBeTruthy();
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
