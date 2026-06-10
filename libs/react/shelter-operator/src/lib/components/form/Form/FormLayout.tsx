import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { FormActions } from './FormActions';
import { FormBlock } from './FormBlock';
import { FormHeader } from './FormHeader';

type TProps = {
  className?: string;
  children: ReactNode;
};

function FormLayout(props: TProps) {
  const { className, children } = props;

  return <div className={mergeCss(className)}>{children}</div>;
}

FormLayout.Actions = FormActions;
FormLayout.Header = FormHeader;
FormLayout.Block = FormBlock;

export { FormLayout };
