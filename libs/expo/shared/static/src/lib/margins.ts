import { Spacings, TSpacing } from './spacings';

export type TMarginProps = {
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
};

const marginMap: Record<keyof TMarginProps, string[]> = {
  mb: ['marginBottom'],
  mt: ['marginTop'],
  ml: ['marginLeft'],
  mr: ['marginRight'],
  my: ['marginTop', 'marginBottom'],
  mx: ['marginLeft', 'marginRight'],
};

export const getMarginStyles = (marginProps: TMarginProps) => {
  if (!marginProps) {
    return {};
  }

  const styles: Record<string, number> = {};

  for (const [key, value] of Object.entries(marginProps)) {
    const spacingValue = Spacings[value as TSpacing];

    if (spacingValue === undefined) {
      continue;
    }

    marginMap[key as keyof TMarginProps].forEach((styleKey) => {
      styles[styleKey] = spacingValue;
    });
  }

  return styles;
};
