import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { FormActions } from './FormActions';
import { FormBlock } from './FormBlock';
import { FormContent } from './FormContent';
import { FormHeader } from './FormHeader';

type TProps = {
  className?: string;
  children: ReactNode;
};

function FormLayout(props: TProps) {
  const { className, children } = props;

  const parentCss = ['flex', 'flex-col', 'flex-1', 'gap-8'];

  return <div className={mergeCss([parentCss, className])}>{children}</div>;
}

FormLayout.Actions = FormActions;
FormLayout.Header = FormHeader;
FormLayout.Content = FormContent;
FormLayout.Block = FormBlock;

export { FormLayout };
