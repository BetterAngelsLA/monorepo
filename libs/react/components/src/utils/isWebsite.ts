export default function isWebsite(value: string | undefined): boolean {
  if (!value) return false;

  const isDomainLike = value.includes('.') && !value.includes(' ');

  return value.startsWith('http') || value.startsWith('www.') || isDomainLike;
}
