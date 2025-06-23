import { TMapClusterMarkerSize } from './MapClusterMarker';

const DEFAULT_SIZE: TMapClusterMarkerSize = 'S';
const BREAKPOINT_S = 10;
const BREAKPOINT_M = 30;
const BREAKPOINT_PLUS = 100;

type TResult = {
  content: string;
  markerSize: TMapClusterMarkerSize;
  showSubscript?: boolean;
};

type TProps = {
  text?: string;
  itemCount?: number;
  size?: TMapClusterMarkerSize;
};

export function getContentAndSize(props: TProps): TResult {
  const { text, itemCount, size } = props;

  if (text) {
    return {
      content: text,
      markerSize: size || DEFAULT_SIZE,
    };
  }

  if (itemCount) {
    return {
      content: getTextPerCount(itemCount),
      markerSize: getSizePerCount(itemCount),
      showSubscript: itemCount >= BREAKPOINT_PLUS,
    };
  }

  return {
    content: '',
    markerSize: DEFAULT_SIZE,
  };
}

function getSizePerCount(itemCount: number): TMapClusterMarkerSize {
  if (itemCount < BREAKPOINT_S) {
    return 'S';
  }

  if (itemCount < BREAKPOINT_M) {
    return 'M';
  }

  return 'L';
}

function getTextPerCount(itemCount: number): string {
  if (itemCount < BREAKPOINT_PLUS) {
    return String(itemCount);
  }

  return `${BREAKPOINT_PLUS - 1}`;
}
