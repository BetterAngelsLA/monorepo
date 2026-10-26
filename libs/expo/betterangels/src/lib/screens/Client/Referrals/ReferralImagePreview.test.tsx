import { fireEvent, render, screen } from '@testing-library/react-native';
import { useImperativeHandle, type ReactNode, type Ref } from 'react';
import { Text, View } from 'react-native';
import { ReferralImagePreview } from './ReferralImagePreview';
import { buildReferralDocumentCopy } from './referralExport';
import { layoutReferralImage } from './referralImage';
import { encodeReferralNotes } from './shared/referralIntakeSidecar';

const native = vi.hoisted(() => ({ capture: vi.fn() }));
type NativeProps = Record<string, unknown> & { children?: ReactNode };

// Keep the real preview component. Only the native SVG boundary is replaced;
// pixel output is separately exercised by the checked-in Android flow.
vi.mock('react-native-svg', () => ({
  default: function SvgBoundary({
    children,
    ref,
    ...props
  }: NativeProps & { ref?: Ref<{ toDataURL: typeof native.capture }> }) {
    useImperativeHandle(ref, () => ({ toDataURL: native.capture }), []);
    return <View {...props}>{children}</View>;
  },
  Rect: (props: NativeProps) => <View testID="svg-background" {...props} />,
  Text: ({ children, ...props }: NativeProps) => (
    <Text testID="svg-line" {...props}>
      {children}
    </Text>
  ),
}));

const input = {
  referral: {
    __typename: 'ReferralType' as const,
    id: 'r1',
    createdAt: '2026-10-15T12:00:00Z',
    shelter: null,
    notes: encodeReferralNotes('Private staff note', {
      substances: 'Private answer',
    }),
  },
  clientName: 'Ana Muñoz',
  generatedAt: '2026-10-15T12:30:00Z',
};

beforeEach(() => {
  native.capture
    .mockReset()
    .mockImplementation((done: (value: string) => void) => done('native-png'));
});

it('renders every layout line with its formatting, white background, and full-document viewBox', async () => {
  const layout = layoutReferralImage(buildReferralDocumentCopy(input));
  const ready = vi.fn();
  await render(<ReferralImagePreview layout={layout} onReady={ready} />);
  const svg = screen.getByTestId('referral-image-preview');
  expect(svg.props.viewBox).toBe(`0 0 ${layout.width} ${layout.height}`);
  expect(screen.getByTestId('svg-background').props).toMatchObject({
    width: layout.width,
    height: layout.height,
    fill: 'white',
  });
  const lines = screen.getAllByTestId('svg-line');
  expect(lines).toHaveLength(layout.lines.length);
  for (const [index, { text, color, ...format }] of layout.lines.entries()) {
    expect(lines[index].props).toMatchObject({
      ...format,
      fill: color ?? '#172b40',
      children: text,
    });
  }
  expect(lines.some((line) => line.props.fontWeight === '700')).toBe(true);
  expect(lines.some((line) => line.props.fontStyle === 'italic')).toBe(true);
  expect(lines.map((line) => line.props.children).join('')).not.toContain(
    'Private answer',
  );
  expect(ready).not.toHaveBeenCalled();
  expect(native.capture).not.toHaveBeenCalled();
});

it('makes the laid-out SVG capturable at full resolution after resizing and updates the reviewed privacy copy', async () => {
  const standard = layoutReferralImage(buildReferralDocumentCopy(input));
  const inclusive = layoutReferralImage(
    buildReferralDocumentCopy({ ...input, includePrivate: true }),
  );
  const ready = vi.fn<(capture: () => Promise<string>) => void>();
  const view = await render(
    <ReferralImagePreview layout={standard} onReady={ready} />,
  );
  const root = screen.root;
  if (!root) throw new Error('Expected a mounted image preview');
  await fireEvent(root, 'layout', {
    nativeEvent: { layout: { width: 480 } },
  });
  expect(screen.getByTestId('referral-image-preview').props).toMatchObject({
    width: 480,
    height: (standard.height * 480) / standard.width,
  });
  await fireEvent(screen.getByTestId('referral-image-preview'), 'layout');
  await expect(ready.mock.lastCall?.[0]()).resolves.toBe('native-png');
  expect(native.capture).toHaveBeenLastCalledWith(expect.any(Function), {
    width: standard.outputWidth,
    height: standard.outputHeight,
  });
  await view.rerender(
    <ReferralImagePreview layout={inclusive} onReady={ready} />,
  );
  const text = screen
    .getAllByTestId('svg-line')
    .map((line) => line.props.children)
    .join('');
  expect(text).toContain('Private answer');
  expect(text).toContain('Private staff note');
  await fireEvent(screen.getByTestId('referral-image-preview'), 'layout');
  await expect(ready.mock.lastCall?.[0]()).resolves.toBe('native-png');
  expect(native.capture).toHaveBeenLastCalledWith(expect.any(Function), {
    width: inclusive.outputWidth,
    height: inclusive.outputHeight,
  });
});
