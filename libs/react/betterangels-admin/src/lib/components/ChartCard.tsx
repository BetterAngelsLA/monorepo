import { Card } from 'antd';
import type { ReactNode } from 'react';
import { mergeCss } from '@monorepo/react/shared';

export function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card size="small" title={title} className={mergeCss(className)}>
      {children}
    </Card>
  );
}
