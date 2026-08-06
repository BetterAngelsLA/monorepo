type TProps = {
  value: string | null | undefined;
  prefix?: string;
  suffix?: string;
};

export function toTestId(props: TProps): string {
  const { value, prefix, suffix } = props;

  if (typeof value !== 'string' || !value.length) {
    return '';
  }

  const valueLower = value.trim();
  const prefixLower = prefix?.length ? `${prefix}-` : '';
  const suffixLower = suffix?.length ? `-${suffix}` : '';

  // Normalize: lowercase, collapse whitespace to dashes, drop anything that
  // isn't a lowercase letter, digit, or dash. Keeps tokens like "e2e" and
  // "interaction-1785966140837" intact — unlike remeda's toKebabCase, which
  // splits on letter<->digit boundaries ("e2e" -> "e-2-e").
  return `${prefixLower}${valueLower}${suffixLower}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
