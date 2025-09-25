import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import TextMedium from '../TextMedium';

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
  style?: ViewStyle;
};

export function ResultsHeader(props: TProps) {
  const {
    renderResultsHeader,
    visibleCount,
    totalCount,
    modelName,
    modelNamePlural,
    style,
  } = props;

  if (renderResultsHeader === null) {
    return null;
  }

  if (renderResultsHeader) {
    return renderResultsHeader(visibleCount, totalCount);
  }

  const itemNameSingular = modelName || 'item';
  const itemNamePlural = modelNamePlural || `${itemNameSingular}s`;

  const normalizedName = visibleCount === 1 ? itemNameSingular : itemNamePlural;

  const text =
    totalCount === undefined
      ? `Displaying ${visibleCount} ${normalizedName}`
      : `Displaying ${visibleCount} of ${totalCount} ${normalizedName}`;

  return (
    <View style={style}>
      <TextMedium size="sm">{text}</TextMedium>
    </View>
  );
}
