import { ReactNode } from 'react';
import { View } from 'react-native';
import { headerLeftInsetStyle, headerRightInsetStyle } from './headerStyles';

/**
 * A header's left or right slot.
 *
 * The JS (web) header lays `headerLeft`/`headerRight` flush against the window
 * edge, where the native bars inset them by ~12pt — so on web a "Back" label or an
 * "Edit" button touches the edge and nothing else on the screen does.
 * `headerLeftContainerStyle` is where that inset belongs, but it is declared by the
 * JS stack rather than native-stack, so passing it is a type error.
 *
 * The inset is a property of the slot, not of what the slot holds: a slot may hold
 * a nav menu or a modal trigger as readily as a button, and those take no `style`
 * prop. Wrapping the content here keeps it one mechanism for all of them, and on
 * native — where the bars already inset and the style is `undefined` — no wrapper
 * is rendered at all.
 */
export function HeaderSlot({
  side,
  children,
}: {
  side: 'left' | 'right';
  children: ReactNode;
}) {
  const inset = side === 'left' ? headerLeftInsetStyle : headerRightInsetStyle;

  return inset ? <View style={inset}>{children}</View> : <>{children}</>;
}
