import { headerVariants } from '../config';

/** Projects a header variant onto the options react-navigation expects. */
export function getNativeHeaderOptions(
  variant: keyof typeof headerVariants = 'default',
) {
  const { backgroundColor, textColor } = headerVariants[variant];

  return {
    headerTitleAlign: 'center' as const,
    headerStyle: { backgroundColor },
    headerTitleStyle: { color: textColor },
  };
}
