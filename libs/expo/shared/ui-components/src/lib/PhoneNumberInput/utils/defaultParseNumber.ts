import { TPhoneWithExtension } from '../types';

export function defaultParseNumber(value: string): TPhoneWithExtension {
  const [number = '', extension] = value.split('x');

  return [number, extension];
}
