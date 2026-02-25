import { mergeCss } from '@monorepo/react/shared';
import type { Decorator } from '@storybook/react';
import { SbkPanel } from '../components';

type TLayoutVariant = 'basic' | 'component';

export type TLayoutParams = {
  className?: string; // tailwind classes
  style?: React.CSSProperties; // inline CSS
  canvasClassName?: string; // tailwind classes
  canvasStyle?: React.CSSProperties; // inline CSS
  variant?: TLayoutVariant;
};

export const CustomLayout: Decorator = (Story, context) => {
  const { customLayout } = (context.parameters ?? {}) as {
    customLayout?: TLayoutParams;
  };

  const {
    className,
    style,
    variant = 'component',
    canvasClassName,
    canvasStyle,
  } = customLayout || {};

  const parentClasses = ['flex', 'justify-center', 'p-8', className];

  return (
    <div className={mergeCss(parentClasses)} style={style}>
      {variant === 'component' && (
        <SbkPanel className={canvasClassName} style={canvasStyle}>
          <Story />
        </SbkPanel>
      )}

      {variant !== 'component' && <Story />}
    </div>
  );
};
