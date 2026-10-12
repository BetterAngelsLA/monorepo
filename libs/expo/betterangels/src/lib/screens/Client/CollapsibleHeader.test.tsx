/**
 * The header has to survive being hidden.
 *
 * It used to be conditionally rendered, so leaving the Profile tab destroyed the
 * client header and the profile photo's `<img>` with it; coming back mounted a
 * new image, which the browser had to decode again — the photo flickered on every
 * switch. Asserting that the children stay mounted while hidden is what keeps
 * that from coming back.
 */
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CollapsibleHeader } from './CollapsibleHeader';

it('keeps its children mounted while hidden', async () => {
  await render(
    <CollapsibleHeader visible={false} testID="header-slot">
      <Text>client header</Text>
    </CollapsibleHeader>,
  );

  // Still in the tree (so the image is not re-created) ... react-native-testing
  // -library gates queries on visibility, hence the explicit opt-in.
  expect(
    screen.getByText('client header', { includeHiddenElements: true }),
  ).toBeOnTheScreen();
  // ... but out of the layout, which is what unmounting used to achieve.
  expect(
    screen.getByTestId('header-slot', { includeHiddenElements: true }),
  ).toHaveStyle({ display: 'none' });
});

it('shows its children when visible', async () => {
  await render(
    <CollapsibleHeader visible testID="header-slot">
      <Text>client header</Text>
    </CollapsibleHeader>,
  );

  expect(screen.getByText('client header')).toBeOnTheScreen();
  expect(screen.getByTestId('header-slot')).not.toHaveStyle({
    display: 'none',
  });
});
