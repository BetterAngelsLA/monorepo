/**
 * @jest-environment node
 */
import { createCsrfInterceptor, createOrgInterceptor } from '@monorepo/fetch';

describe('createCsrfInterceptor', () => {
  it('injects CSRF header when token is available', async () => {
    const read = jest.fn().mockResolvedValue('tok');
    const refresh = jest.fn();
    const next = jest.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(read, refresh, 'csrftoken', 'x-csrftoken');
    await interceptor('/api', {}, next);

    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('x-csrftoken')).toBe('tok');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes token when missing, then injects', async () => {
    const read = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('fresh');
    const refresh = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(read, refresh, 'csrftoken', 'x-csrf');
    await interceptor('/api', {}, next);

    expect(refresh).toHaveBeenCalledWith('/admin/login/');
    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('x-csrf')).toBe('fresh');
  });

  it('omits header when token is null and refresh fails', async () => {
    const read = jest.fn().mockResolvedValue(null);
    const refresh = jest.fn().mockRejectedValue(new Error('offline'));
    const next = jest.fn().mockResolvedValue(new Response());

    const interceptor = createCsrfInterceptor(read, refresh, 'csrftoken', 'x-csrf');
    await expect(interceptor('/api', {}, next)).rejects.toThrow('offline');
  });
});

describe('createOrgInterceptor', () => {
  it('injects Org header when stored', async () => {
    const storage = { getItem: jest.fn().mockResolvedValue('org-1') };
    const next = jest.fn().mockResolvedValue(new Response());

    const interceptor = createOrgInterceptor(storage, 'org_key');
    await interceptor('/api', {}, next);

    const init = next.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-Organization-ID')).toBe('org-1');
  });

  it('passes through when no org stored', async () => {
    const storage = { getItem: jest.fn().mockResolvedValue(null) };
    const next = jest.fn().mockResolvedValue(new Response());

    const interceptor = createOrgInterceptor(storage, 'org_key');
    await interceptor('/api', { headers: { Authorization: 'Bearer x' } }, next);

    const init = next.mock.calls[0][1] as RequestInit;
    const h = new Headers(init.headers);
    expect(h.get('X-Organization-ID')).toBeNull();
    expect(h.get('Authorization')).toBe('Bearer x');
  });
});
