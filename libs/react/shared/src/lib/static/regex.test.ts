import { Regex } from './regex';

describe('Regex', () => {
  describe('nonBlank', () => {
    it.each([
      ['hello', true],
      [' a ', true],
      ['0', true],
      ['', false],
      ['   ', false],
      ['\t\n', false],
    ])('%p => %p', (input, expected) => {
      expect(Regex.nonBlank.test(input)).toBe(expected);
    });
  });

  describe('date', () => {
    it.each([
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
    ])('%p => %p', (input, expected) => {
      expect(Regex.date.test(input)).toBe(expected);
    });
  });

  describe('time', () => {
    it.each([
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
    ])('%p => %p', (input, expected) => {
      expect(Regex.time.test(input)).toBe(expected);
    });
  });

  describe('email', () => {
    it.each([
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
    ])('%p => %p', (input, expected) => {
      expect(Regex.email.test(input)).toBe(expected);
    });
  });

  describe('phoneNumber', () => {
    it.each([
      ['2125551234', true],
      ['4155551234', true],
      ['9998887777', true],
      ['', false],
      ['123', false],
      ['1234567890', false], // starts with 1, not [2-9]
      ['0123456789', false], // starts with 0
      ['212555123x', false],
      ['212-555-1234', false],
      ['(212) 555-1234', false],
    ])('%p => %p', (input, expected) => {
      expect(Regex.phoneNumber.test(input)).toBe(expected);
    });
  });

  describe('phoneNumberWithExtensionUS', () => {
    it.each([
      ['2125551234', true],
      ['2125551234x123', true],
      ['2125551234x12345', true],
      ['2125551234x', false],
      ['2125551234ext', false],
      ['1234567890', false], // starts with 1
    ])('%p => %p', (input, expected) => {
      expect(Regex.phoneNumberWithExtensionUS.test(input)).toBe(expected);
    });
  });

  describe('californiaId', () => {
    it.each([
      ['A1234567', true],
      ['Z0000000', true],
      ['a1234567', false], // lowercase
      ['A123456', false], // too short
      ['A12345678', false], // too long
      ['1A234567', false], // starts with digit
      ['', false],
    ])('%p => %p', (input, expected) => {
      expect(Regex.californiaId.test(input)).toBe(expected);
    });
  });

  describe('websiteBasic', () => {
    it.each([
      // bare domains
      ['google.com', true],
      ['example.org', true],
      ['sub.domain.co.uk', true],
      ['my-site.io', true],
      // with protocol
      ['https://google.com', true],
      ['http://example.org', true],
      ['https://www.example.com', true],
      // with paths
      ['example.org/path', true],
      ['example.org/path/to/page', true],
      ['https://example.com/search?q=test', true],
      // edge cases
      ['www.example.com', true],
      ['x.co', true],
      // invalid
      ['', false],
      ['not a url', false],
      ['google', false], // no TLD
      ['https://google', false], // no TLD
      ['.com', false], // no domain
      ['google.', false], // trailing dot, no TLD chars
      ['just text with spaces', false],
    ])('%p => %p', (input, expected) => {
      expect(Regex.websiteBasic.test(input)).toBe(expected);
    });
  });
});
