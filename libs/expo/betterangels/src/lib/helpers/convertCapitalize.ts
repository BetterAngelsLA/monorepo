export default function convertCapitalize(input: string) {
  let result = input.replace(/_/g, ' ');

  result = result.toLowerCase();

  result = result.replace(/\b\w/g, (char) => char.toUpperCase());

  return result;
}
