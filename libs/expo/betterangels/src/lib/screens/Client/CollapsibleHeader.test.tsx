/**
 * The header has to survive being hidden: unmounting it makes the browser lay out
 * and decode the profile photo again on every tab switch.
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
  // ... but out of the layout, as unmounting would leave it.
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
