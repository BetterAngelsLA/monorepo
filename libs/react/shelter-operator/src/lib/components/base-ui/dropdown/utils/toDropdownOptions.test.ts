import { toDropdownOptions } from './toDropdownOptions';

enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
  Yellow = 'YELLOW',
}

const colorMap: Record<Color, string> = {
  [Color.Red]: 'Red',
  [Color.Green]: 'Green',
  [Color.Blue]: 'Blue',
  [Color.Yellow]: 'Yellow',
};

describe('toDropdownOptions', () => {
  it('returns options in default object key order', () => {
    const result = toDropdownOptions(colorMap);

    expect(result).toEqual([
      { value: 'RED', label: 'Red' },
      { value: 'GREEN', label: 'Green' },
      { value: 'BLUE', label: 'Blue' },
      { value: 'YELLOW', label: 'Yellow' },
    ]);
  });

  it('pins head keys to the beginning', () => {
    const result = toDropdownOptions(colorMap, {
      head: [Color.Blue],
    });

    expect(result).toEqual([
      { value: 'BLUE', label: 'Blue' },
      { value: 'RED', label: 'Red' },
      { value: 'GREEN', label: 'Green' },
      { value: 'YELLOW', label: 'Yellow' },
    ]);
  });

  it('pins tail keys to the end', () => {
    const result = toDropdownOptions(colorMap, {
      tail: [Color.Red],
    });

    expect(result).toEqual([
      { value: 'GREEN', label: 'Green' },
      { value: 'BLUE', label: 'Blue' },
      { value: 'YELLOW', label: 'Yellow' },
      { value: 'RED', label: 'Red' },
    ]);
  });

  it('supports both head and tail together', () => {
    const result = toDropdownOptions(colorMap, {
      head: [Color.Yellow],
      tail: [Color.Red],
    });

    expect(result).toEqual([
      { value: 'YELLOW', label: 'Yellow' },
      { value: 'GREEN', label: 'Green' },
      { value: 'BLUE', label: 'Blue' },
      { value: 'RED', label: 'Red' },
    ]);
  });

  it('treats a plain array as tail (shorthand)', () => {
    const result = toDropdownOptions(colorMap, [Color.Blue, Color.Yellow]);

    expect(result).toEqual([
      { value: 'RED', label: 'Red' },
      { value: 'GREEN', label: 'Green' },
      { value: 'BLUE', label: 'Blue' },
      { value: 'YELLOW', label: 'Yellow' },
    ]);
  });

  it('handles full explicit order via tail (all keys)', () => {
    const result = toDropdownOptions(colorMap, [
      Color.Yellow,
      Color.Blue,
      Color.Green,
      Color.Red,
    ]);

    expect(result).toEqual([
      { value: 'YELLOW', label: 'Yellow' },
      { value: 'BLUE', label: 'Blue' },
      { value: 'GREEN', label: 'Green' },
      { value: 'RED', label: 'Red' },
    ]);
  });

  it('falls back to empty label for keys not in the map', () => {
    const partial = { [Color.Red]: 'Red', [Color.Green]: 'Green' } as Record<
      Color,
      string
    >;

    const result = toDropdownOptions(partial, { head: [Color.Blue] });

    expect(result[0]).toEqual({ value: 'BLUE', label: '' });
  });
});
