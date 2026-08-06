import { toKebabCase } from 'remeda';

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

  const valueLower = value.toLowerCase();
  const prefixLower = prefix?.length ? `${prefix.toLowerCase()}-` : '';
  const suffixLower = suffix?.length ? `-${suffix.toLowerCase()}` : '';

  return toKebabCase(`${prefixLower}${valueLower}${suffixLower}`);
}
