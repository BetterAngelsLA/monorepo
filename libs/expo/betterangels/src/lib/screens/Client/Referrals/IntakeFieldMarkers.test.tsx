import { render, screen } from '@testing-library/react-native';
import { View, type ViewProps } from 'react-native';
import { uiComponents } from '../../../../__mocks__/sharedBarrels';
import { MemoryIcon, PiiTag } from './IntakeFieldMarkers';
vi.mock('@monorepo/expo/shared/ui-components', () => uiComponents());
vi.mock('react-native-svg', () => ({
  default: (props: ViewProps) => <View {...props} testID="marker" />,
  Ellipse: () => null,
  Path: () => null,
}));

it('hides decorative storage artwork but preserves the meaningful sensitive-data label', async () => {
  await render(
    <>
      <MemoryIcon color="#4E9E6A" />
      <PiiTag />
    </>,
  );
  expect(
    screen.getByTestId('marker', { includeHiddenElements: true }).props,
  ).toMatchObject({
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });
  expect(screen.getByText('PII')).toBeOnTheScreen();
});
