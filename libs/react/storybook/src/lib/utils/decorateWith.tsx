import type { Decorator } from '@storybook/react';
import { ComponentType, type PropsWithChildren } from 'react';

export function decorateWith<P>(
  Wrapper: ComponentType<PropsWithChildren<P>>,
  wrapperProps?: P
): Decorator {
  return (Story, context) => (
    <Wrapper {...(wrapperProps as P)}>
      <Story {...context.args} />
    </Wrapper>
  );
}
