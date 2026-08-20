import { uploadFileToS3WithPresignedPost } from './s3Upload.web';

const presignedPost = {
  url: 'https://s3.example.com',
  fields: {
    key: 'keys/consent.pdf',
    'Content-Type': 'application/pdf',
    policy: 'signed-policy',
  },
  key: 'keys/consent.pdf',
};

const file = {
  uri: 'blob:some-file',
  name: 'consent.pdf',
  type: 'application/pdf',
};

class MockXMLHttpRequest {
  static instance: MockXMLHttpRequest | null = null;

  upload = {
    onprogress: null as
      | ((event: {
          lengthComputable: boolean;
          loaded: number;
          total: number;
        }) => void)
      | null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  status = 0;
  responseText = '';
  sentBody: unknown = null;
  aborted = false;
  url = '';
  method = '';

  constructor() {
    MockXMLHttpRequest.instance = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: unknown) {
    this.sentBody = body;
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

async function getXhr(): Promise<MockXMLHttpRequest> {
  await vi.waitFor(() => {
    expect(MockXMLHttpRequest.instance).not.toBeNull();
  });

  return MockXMLHttpRequest.instance as MockXMLHttpRequest;
}

describe('s3Upload.web', () => {
  const originalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    MockXMLHttpRequest.instance = null;
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve(new Blob(['file-content'])),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.XMLHttpRequest = originalXHR;
  });

  it('posts the presigned fields and file as multipart and resolves on 2xx', async () => {
    const promise = uploadFileToS3WithPresignedPost({ presignedPost, file });
    const xhr = await getXhr();

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe(presignedPost.url);

    const body = xhr.sentBody as FormData;
    expect(body).toBeInstanceOf(FormData);
    const entries = Object.fromEntries(body.entries());
    expect(entries['key']).toBe('keys/consent.pdf');
    expect(entries['policy']).toBe('signed-policy');
    expect(entries['Content-Type']).toBe('application/pdf');
    expect(entries['file']).toBeDefined();

    xhr.status = 204;
    xhr.onload?.();

    await expect(promise).resolves.toEqual({ key: 'keys/consent.pdf' });
  });

  it('reports byte-level progress from the upload event', async () => {
    const onProgress = vi.fn();

    const promise = uploadFileToS3WithPresignedPost({
      presignedPost,
      file,
      onProgress,
    });
    const xhr = await getXhr();

    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    });

    expect(onProgress).toHaveBeenCalledWith({ bytesSent: 50, totalBytes: 100 });

    xhr.status = 204;
    xhr.onload?.();

    await promise;
  });

  it('rejects on non-2xx responses', async () => {
    const promise = uploadFileToS3WithPresignedPost({ presignedPost, file });
    const xhr = await getXhr();

    xhr.status = 403;
    xhr.responseText = 'AccessDenied';
    xhr.onload?.();

    await expect(promise).rejects.toThrow(/status 403/);
  });

  it('aborts the request when the signal is aborted', async () => {
    const controller = new AbortController();

    const promise = uploadFileToS3WithPresignedPost({
      presignedPost,
      file,
      signal: controller.signal,
    });
    const xhr = await getXhr();

    controller.abort();

    expect(xhr.aborted).toBe(true);
    await expect(promise).rejects.toThrow(/aborted/);
  });
});
