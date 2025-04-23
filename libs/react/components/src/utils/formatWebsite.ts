export default function formatWebsite(value: string): string {
  if (value.startsWith('http')) {
    return value;
  }

  return `https://${value}`;
}
