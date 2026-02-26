import { Card } from 'antd';
import type { ReactNode } from 'react';

export default function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card size="small" title={title}>
      {children}
    </Card>
  );
}
