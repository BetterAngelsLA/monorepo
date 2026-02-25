import { asNumber } from './number';
import { readAtPath } from './readAtPath';

type TProps = {
  source: unknown;
  path: string | readonly string[];
  fallback: number;
  min?: number;
};

export function readNumberAtPathOr(props: TProps): number {
  const { source, path, fallback, min } = props;

  const value = asNumber(readAtPath(source, path));

  if (Number.isNaN(value)) {
    return fallback;
  }

  if (typeof min === 'number' && value < min) {
    return fallback;
  }

  return value;
}
