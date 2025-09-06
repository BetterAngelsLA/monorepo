import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import TextMedium from '../TextMedium';

export type TRenderResultsHeader = (
  visible: number,
  total: number | undefined
) => ReactNode | null;

type TProps = {
  visibleCount: number;
  totalCount?: number;
  renderResultsHeader?: TRenderResultsHeader | null;
  style?: ViewStyle;
};

export function ResultsHeader(props: TProps) {
  const { renderResultsHeader, visibleCount, totalCount, style } = props;

  if (renderResultsHeader === null) {
    return null;
  }

  if (renderResultsHeader) {
    return renderResultsHeader(visibleCount, totalCount);
  }

  const text =
    totalCount === undefined
      ? `Displaying ${visibleCount} items`
      : `Displaying ${visibleCount} of ${totalCount} items`;

  return (
    <View style={style}>
      <TextMedium size="sm">{text}</TextMedium>
    </View>
  );
}
