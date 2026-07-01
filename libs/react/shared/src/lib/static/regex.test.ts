import { Regex } from './regex';

describe('Regex', () => {
  describe('nonBlank', () => {
    const cases: [string, boolean][] = [
      ['hello', true],
      [' a ', true],
      ['0', true],
      ['', false],
      ['   ', false],
      ['\t\n', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.nonBlank.test(input)).toBe(expected);
    });
  });

  describe('date', () => {
    const cases: [string, boolean][] = [
      ['01/01/2020', true],
      ['12/31/1999', true],
      ['06/15/2024', true],
      ['00/01/2020', false],
      ['13/01/2020', false],
      ['01/00/2020', false],
      ['01/32/2020', false],
      ['01/01/1899', false],
      ['01-01-2020', false],
      ['2020/01/01', false],
      ['', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.date.test(input)).toBe(expected);
    });
  });

  describe('time', () => {
    const cases: [string, boolean][] = [
      ['00:00', true],
      ['12:30', true],
      ['23:59', true],
      ['24:00', false],
      ['12:60', false],
      ['12:5', false],
      ['1250', false],
      ['12-30', false],
      ['', false],
      ['noon', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.time.test(input)).toBe(expected);
    });
  });

  describe('email', () => {
    const cases: [string, boolean][] = [
      ['user@example.com', true],
      ['first.last@domain.co', true],
      ['a@b.co', true],
      ['user+tag@example.org', true],
      ['user%name@example.com', true],
      ['', false],
      ['plainstring', false],
      ['@missing-user.com', false],
      ['user@', false],
      ['user@.com', false],
      ['user@domain', false],
      ['user name@domain.com', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.email.test(input)).toBe(expected);
    });
  });

  describe('phoneNumber', () => {
    const cases: [string, boolean][] = [
      ['2125551234', true],
      ['4155551234', true],
      ['9998887777', true],
      ['', false],
      ['123', false],
      ['1234567890', false],
      ['0123456789', false],
      ['212555123x', false],
      ['212-555-1234', false],
      ['(212) 555-1234', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.phoneNumber.test(input)).toBe(expected);
    });
  });

  describe('phoneNumberWithExtensionUS', () => {
    const cases: [string, boolean][] = [
      ['2125551234', true],
      ['2125551234x123', true],
      ['2125551234x12345', true],
      ['2125551234x', false],
      ['2125551234ext', false],
      ['1234567890', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.phoneNumberWithExtensionUS.test(input)).toBe(expected);
    });
  });

  describe('californiaId', () => {
    const cases: [string, boolean][] = [
      ['A1234567', true],
      ['Z0000000', true],
      ['a1234567', false],
      ['A123456', false],
      ['A12345678', false],
      ['1A234567', false],
      ['', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.californiaId.test(input)).toBe(expected);
    });
  });

  describe('domain', () => {
    const cases: [string, boolean][] = [
      ['google.com', true],
      ['example.org', true],
      ['sub.domain.co.uk', true],
      ['my-site.io', true],
      ['example.org/path', true],
      ['example.org/path/to/page', true],
      ['example.org?q=test', true],
      ['example.org/path?a=1&b=2', true],
      ['www.example.com', true],
      ['x.co', true],
      ['', false],
      ['not a url', false],
      ['google', false],
      ['https://google.com', false],
      ['http://example.org', false],
      ['.com', false],
      ['google.', false],
      ['example.c', false],
      ['example.123', false],
      ['just text with spaces', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.domain.test(input)).toBe(expected);
    });
  });

  describe('url', () => {
    const cases: [string, boolean][] = [
      ['https://google.com', true],
      ['http://example.org', true],
      ['https://www.example.com', true],
      ['https://example.com/search?q=test', true],
      ['http://example.org/path/to/page', true],
      ['https://example.com?a=1', true],
      ['https://example.com/path?a=1&b=2', true],
      ['google.com', false],
      ['example.org/path', false],
      ['www.example.com', false],
      ['https://google', false],
      ['https://.com', false],
      ['https://example.c', false],
      ['https://example.123', false],
      ['ftp://example.com', false],
      ['', false],
      ['https://', false],
      ['http:/example.com', false],
    ];

    it.each(cases)('%p => %p', (input, expected) => {
      expect(Regex.url.test(input)).toBe(expected);
    });
  });
});
