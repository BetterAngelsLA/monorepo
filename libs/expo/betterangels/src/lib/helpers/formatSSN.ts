export default function formatSSN(value: string) {
  const part1 = value.slice(0, 3);
  const part2 = value.slice(3, 5);
  const part3 = value.slice(5, 9);

  return `${part1}${part1.length === 3 ? '-' : ''}${part2}${
    part2.length === 2 ? '-' : ''
  }${part3}`;
}
