import { Activity } from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

/**
 * The client header is hidden with `<Activity mode="hidden">` instead of being
 * unmounted, so the profile photo's `<img>` is not laid out and decoded again on
 * every tab switch. That rests on React keeping hidden children mounted — this
 * pins the assumption the screen relies on, because a renderer that unmounted
 * them would bring the flicker back with every other suite still green.
 */
it('keeps hidden children mounted', async () => {
  await render(
    <Activity mode="hidden">
      <Text testID="hidden-child">child</Text>
    </Activity>,
  );

  // Out of the tree as far as queries and layout are concerned…
  expect(screen.queryByTestId('hidden-child')).toBeNull();
  // …but still mounted.
  expect(
    screen.queryByTestId('hidden-child', { includeHiddenElements: true }),
  ).not.toBeNull();
});
