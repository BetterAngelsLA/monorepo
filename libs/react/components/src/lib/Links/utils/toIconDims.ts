type TProps = {
  width?: number | null;
  height?: number | null;
};

/**
 * Resolves the `width`/`height` to spread onto an icon.
 *
 * When at least one axis is given we return BOTH keys, with the missing axis
 * set to `undefined` — never omitted.
 *
 * When neither axis is given we return `{}` so the icon keeps its own default
 * size.
 */
export function toIconDims(props: TProps) {
  const { width, height } = props;

  const resolvedWidth = width ?? undefined;
  const resolvedHeight = height ?? undefined;

  if (resolvedWidth === undefined && resolvedHeight === undefined) {
    return {};
  }

  return { width: resolvedWidth, height: resolvedHeight };
}
