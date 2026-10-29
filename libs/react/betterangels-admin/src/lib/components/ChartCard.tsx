import { Card } from 'antd';
import type { ReactNode } from 'react';
import { mergeCss } from '@monorepo/react/shared';

export function ChartCard({
  title,
  children,
  className = '',
  extra,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Header controls, right-aligned beside the title — view switches, filters, links. */
  extra?: ReactNode;
}) {
  return (
    <Card
      size="small"
      title={title}
      extra={extra}
      className={mergeCss(className)}
    >
      {children}
    </Card>
  );
}
