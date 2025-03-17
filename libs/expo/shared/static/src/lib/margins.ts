import { Spacings, TSpacing } from './spacings';

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

const marginMapKeys = Object.keys(marginMap);

export const getMarginStyles = (props: TMarginProps) => {
  if (!props) {
    return {};
  }

  const styles: Record<string, number> = {};

  for (const key of marginMapKeys) {
    const marginProp = props[key as keyof TMarginProps];

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
