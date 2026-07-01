import { readCsrfToken, refreshCsrfToken } from './csrfTokenProvider';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/`;
}
function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const n = c.indexOf('=') > -1 ? c.substring(0, c.indexOf('=')).trim() : c.trim();
    document.cookie = `${n}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

describe('readCsrfToken', () => {
  beforeEach(() => clearCookies());
  it('returns null when cookie missing', async () => {
    expect(await readCsrfToken('csrftoken')).toBeNull();
  });
  it('returns value when cookie present', async () => {
    setCookie('csrftoken', 'abc123');
    expect(await readCsrfToken('csrftoken')).toBe('abc123');
  });
  it('returns value despite jsdom merging duplicates', async () => {
    setCookie('csrftoken', 'first');
    setCookie('csrftoken', 'second');
    expect(await readCsrfToken('csrftoken')).not.toBeNull();
  });
});

describe('refreshCsrfToken', () => {
  it('calls fetch with include credentials', async () => {
    const fn = jest.fn().mockResolvedValue({ ok: true } as Response);
    window.fetch = fn as any;
    await refreshCsrfToken('/admin/login/');
    expect(fn).toHaveBeenCalledWith('/admin/login/', { credentials: 'include' });
  });
});
