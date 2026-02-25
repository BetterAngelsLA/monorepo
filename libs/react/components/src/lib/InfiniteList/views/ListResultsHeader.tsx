import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';

export type TRenderListResultsHeader = (
  visible: number,
  total: number | undefined
) => ReactNode | null;

type TProps = {
  visibleCount: number;
  totalCount?: number;
  renderResultsHeader?: TRenderListResultsHeader | null;
  modelName?: string;
  modelNamePlural?: string;
  className?: string;
};

export function ListResultsHeader(props: TProps) {
  const {
    renderResultsHeader,
    visibleCount,
    totalCount,
    modelName,
    modelNamePlural,
    className,
  } = props;

  // Explicit opt-out
  if (renderResultsHeader === null) {
    return null;
  }

  // Custom render hook
  if (renderResultsHeader) {
    return renderResultsHeader(visibleCount, totalCount);
  }

  const itemNameSingular = modelName || 'item';
  const itemNamePlural = modelNamePlural || `${itemNameSingular}s`;

  const normalizedName = visibleCount === 1 ? itemNameSingular : itemNamePlural;

  const text =
    typeof totalCount === 'number'
      ? `Displaying ${visibleCount} of ${totalCount} ${itemNamePlural}`
      : `Displaying ${visibleCount} ${normalizedName}`;

  const parentCss = [
    'flex',
    'items-center',
    'border-2 border-blue-500',
    className,
  ];

  return <div className={mergeCss(parentCss)}>{text}</div>;
}
