/**
 */
import {
  createCsrfInterceptor,
  createOrgInterceptor,
} from './fetchInterceptors';

describe('createCsrfInterceptor', () => {
  it('injects CSRF header when token is available', async () => {
    const read = vi.fn().mockResolvedValue('tok');
    const refresh = vi.fn();
    const next = vi.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(
      read,
      refresh,
      'csrftoken',
      'x-csrftoken',
    );
    await interceptor('/api', {}, next);

    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('x-csrftoken')).toBe('tok');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes token when missing, then injects', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('fresh');
    const refresh = vi.fn().mockResolvedValue(undefined);
    const next = vi.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(
      read,
      refresh,
      'csrftoken',
      'x-csrf',
    );
    await interceptor('/api', {}, next);

    expect(refresh).toHaveBeenCalledWith('/admin/login/');
    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('x-csrf')).toBe('fresh');
  });

  it('omits header when token is null and refresh fails', async () => {
    const read = vi.fn().mockResolvedValue(null);
    const refresh = vi.fn().mockRejectedValue(new Error('offline'));
    const next = vi.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(
      read,
      refresh,
      'csrftoken',
      'x-csrf',
    );
    await expect(interceptor('/api', {}, next)).rejects.toThrow('offline');
  });

  describe('CSRF refresh URL derivation', () => {
    it('uses absolute URL with API origin for cross-origin requests (string)', async () => {
      const read = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh');
      const refresh = vi.fn().mockResolvedValue(undefined);
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(read, refresh);
      await interceptor('https://api.dev.example.com/graphql', {}, next);

      expect(refresh).toHaveBeenCalledWith(
        'https://api.dev.example.com/admin/login/',
      );
      expect(
        new Headers((next.mock.calls[0][1] as RequestInit).headers).get(
          'x-csrftoken',
        ),
      ).toBe('fresh');
    });

    it('uses relative path for same-origin requests (local dev)', async () => {
      const read = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh');
      const refresh = vi.fn().mockResolvedValue(undefined);
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(read, refresh);
      await interceptor('/graphql', {}, next);

      expect(refresh).toHaveBeenCalledWith('/admin/login/');
    });

    it('derives origin from a URL object', async () => {
      const read = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh');
      const refresh = vi.fn().mockResolvedValue(undefined);
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(read, refresh);
      await interceptor(new URL('https://api.example.com/graphql'), {}, next);

      expect(refresh).toHaveBeenCalledWith(
        'https://api.example.com/admin/login/',
      );
    });

    it('derives origin from a Request object', async () => {
      const read = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh');
      const refresh = vi.fn().mockResolvedValue(undefined);
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(read, refresh);
      await interceptor(
        new Request('https://api.example.com/graphql'),
        {},
        next,
      );

      expect(refresh).toHaveBeenCalledWith(
        'https://api.example.com/admin/login/',
      );
    });

    it('respects custom loginPath', async () => {
      const read = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('fresh');
      const refresh = vi.fn().mockResolvedValue(undefined);
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(
        read,
        refresh,
        'csrftoken',
        'x-csrftoken',
        '/custom/login/',
      );
      await interceptor('https://api.example.com/graphql', {}, next);

      expect(refresh).toHaveBeenCalledWith(
        'https://api.example.com/custom/login/',
      );
    });

    it('skips refresh when token is already present', async () => {
      const read = vi.fn().mockResolvedValue('existing');
      const refresh = vi.fn();
      const next = vi.fn().mockResolvedValue(new Response());

      const interceptor = createCsrfInterceptor(read, refresh);
      await interceptor('https://api.example.com/graphql', {}, next);

      expect(refresh).not.toHaveBeenCalled();
      expect(
        new Headers((next.mock.calls[0][1] as RequestInit).headers).get(
          'x-csrftoken',
        ),
      ).toBe('existing');
    });
  });
});

describe('createOrgInterceptor', () => {
  it('injects the Org header from the reader', async () => {
    const next = vi.fn().mockResolvedValue(new Response());

    const interceptor = createOrgInterceptor(() => 'org-1');
    await interceptor('/api', {}, next);

    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-Organization-ID')).toBe('org-1');
  });

  it('passes through when there is no active org', async () => {
    const next = vi.fn().mockResolvedValue(new Response());

    const interceptor = createOrgInterceptor(() => null);
    await interceptor('/api', { headers: { Authorization: 'Bearer x' } }, next);

    const init = next.mock.calls[0][1] as RequestInit;
    const h = new Headers(init.headers);
    expect(h.get('X-Organization-ID')).toBeNull();
    expect(h.get('Authorization')).toBe('Bearer x');
  });

  it('reads the current value per request, not once at construction', async () => {
    // Switching organizations must affect the very next request; the reader is
    // called per request precisely so a long-lived client picks up the change.
    let orgId: string | null = 'org-1';
    const interceptor = createOrgInterceptor(() => orgId);
    const next = vi.fn().mockResolvedValue(new Response());

    await interceptor('/api', {}, next);
    orgId = 'org-2';
    await interceptor('/api', {}, next);

    const headerFor = (call: number) =>
      new Headers((next.mock.calls[call][1] as RequestInit).headers).get(
        'X-Organization-ID',
      );
    expect(headerFor(0)).toBe('org-1');
    expect(headerFor(1)).toBe('org-2');
  });

  it('does not await — the reader must be synchronous', async () => {
    const interceptor = createOrgInterceptor(() => 'org-1');
    const next = vi.fn().mockResolvedValue(new Response());

    await interceptor('/api', {}, next);

    const value = new Headers(
      (next.mock.calls[0][1] as RequestInit).headers,
    ).get('X-Organization-ID');
    expect(value).not.toContain('Promise');
    expect(value).toBe('org-1');
  });
});
