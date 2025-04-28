import { Spacings } from './spacings';
import { TSpacing } from './types';

export type TMarginProps = {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
};

const marginMap: Record<keyof TMarginProps, string> = {
  mb: 'marginBottom',
  mt: 'marginTop',
  ml: 'marginLeft',
  mr: 'marginRight',
  my: 'marginVertical',
  mx: 'marginHorizontal',
};

export const marginPropKeys = Object.keys(marginMap) as (keyof TMarginProps)[];

export function omitMarginProps<T extends Record<string, any>>(props: T) {
  const cloneProps: Record<string, any> = { ...props };

  for (const key of marginPropKeys) {
    delete cloneProps[key];
  }

  return cloneProps as Omit<T, keyof TMarginProps>;
}

export const getMarginStyles = (props: TMarginProps) => {
  if (!props) {
    return {};
  }

  const styles: Record<string, number> = {};

  for (const key of marginPropKeys) {
    const marginProp = props[key];

    if (!marginProp) {
      continue;
    }

    const marginValue = Spacings[marginProp as TSpacing];

    if (marginValue === undefined) {
      continue;
    }

    const marginPropName = marginMap[key as keyof TMarginProps];

    styles[marginPropName] = marginValue;
  }

  return styles;
};
