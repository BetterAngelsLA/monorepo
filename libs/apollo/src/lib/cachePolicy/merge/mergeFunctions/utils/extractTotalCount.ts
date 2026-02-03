import { readAtPath, toNonNegativeInteger } from '../../../../utils';

type TProps = {
  primaryObject: Record<string, unknown>;
  fallbackObject?: Record<string, unknown>;
  totalCountPath: string | ReadonlyArray<string>;
};

export function extractTotalCount(props: TProps): number | undefined {
  const { primaryObject, fallbackObject, totalCountPath } = props;

  const primaryVal = toNonNegativeInteger(
    readAtPath<unknown>(primaryObject, totalCountPath)
  );

  if (typeof primaryVal === 'number') {
    return primaryVal;
  }

  const fallbackVal = toNonNegativeInteger(
    readAtPath<unknown>(fallbackObject, totalCountPath)
  );

  return fallbackVal;
}
