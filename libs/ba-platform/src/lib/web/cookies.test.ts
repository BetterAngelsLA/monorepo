import { eraseCookie, getCookie } from './cookies';

function setTestCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/`;
}

describe('getCookie', () => {
  beforeEach(() => {
    // Clear all cookies between tests
    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  });

  it('returns empty array for missing cookie', () => {
    expect(getCookie('nonexistent')).toEqual([]);
  });

  it('returns single match', () => {
    setTestCookie('token', 'abc123');
    expect(getCookie('token')).toEqual(['abc123']);
  });

  it('returns multiple matches for duplicate cookies (when jsdom allows)', () => {
    // jsdom may merge duplicate cookies; verify we get at least one match
    setTestCookie('token', 'abc123');
    setTestCookie('token', 'def456');
    const result = getCookie('token');
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The last-set value should be present
    expect(result).toContain('def456');
  });

  it('does not match substring cookie names', () => {
    setTestCookie('token', 'abc');
    setTestCookie('tokenId', 'xyz');
    expect(getCookie('token')).toEqual(['abc']);
    expect(getCookie('tokenId')).toEqual(['xyz']);
  });
});

describe('eraseCookie', () => {
  it('sets expired cookie without domain', () => {
    // eraseCookie modifies document.cookie; we verify by checking the cookie is gone
    setTestCookie('toErase', 'value');
    expect(getCookie('toErase')).toHaveLength(1);

    eraseCookie('toErase');

    // After erase, the cookie should be cleared (expired)
    const remaining = getCookie('toErase');
    expect(remaining).toEqual([]);
  });
});
