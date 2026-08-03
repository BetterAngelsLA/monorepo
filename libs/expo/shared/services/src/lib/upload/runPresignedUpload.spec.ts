import { OperationInfoError, PresignedUploadError, S3UploadError, UploadAbortedError } from './errors';
import { runPresignedUpload } from './runPresignedUpload';
import { unwrapPayload } from './unwrapPayload';
import {
  TPresignedUpload,
  TUploadFile,
  TUploadProgress,
  TSavedUpload,
} from './types';

const uploadFileToS3 = vi.hoisted(() => vi.fn());

vi.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
}));

vi.mock('../s3', () => ({
  uploadFileToS3WithPresignedPost: uploadFileToS3,
}));

const file = (name: string): TUploadFile => ({
  uri: `file://${name}`,
  name,
  type: 'application/pdf',
});

const sequentialRefId = () => {
  let n = 0;
  return () => `ref-${n++}`;
};

const presigned = (refId: string): TPresignedUpload => ({
  refId,
  url: 'https://s3.example.com',
  fields: { key: `keys/${refId}` },
  presignedKey: `keys/${refId}`,
  uploadToken: `token-${refId}`,
});

describe('runPresignedUpload', () => {
  beforeEach(() => {
    uploadFileToS3.mockReset();
  });

  it('uploads all files and resolves with the persisted result', async () => {
    uploadFileToS3.mockResolvedValue({ key: 'k' });
    const resolveUpload = vi.fn(async (saved: TSavedUpload[]) => saved.length);

    const result = await runPresignedUpload({
      files: [file('a.pdf'), file('b.pdf')],
      generateRefId: sequentialRefId(),
      generateUpload: async (inputs) => inputs.map((input) => presigned(input.refId)),
      resolveUpload,
    });

    expect(uploadFileToS3).toHaveBeenCalledTimes(2);
    expect(resolveUpload).toHaveBeenCalledTimes(1);

    const saved = resolveUpload.mock.calls[0][0] as TSavedUpload[];
    expect(saved).toHaveLength(2);
    expect(saved[0]).toMatchObject({
      filename: 'a.pdf',
      contentType: 'application/pdf',
      presignedKey: 'keys/ref-0',
      uploadToken: 'token-ref-0',
    });
    expect(saved[1]).toMatchObject({ filename: 'b.pdf' });
    expect(result).toBe(2);
  });

  it('emits progress through the stages', async () => {
    uploadFileToS3.mockResolvedValue({ key: 'k' });
    const events: TUploadProgress[] = [];

    await runPresignedUpload({
      files: [file('a.pdf')],
      generateRefId: sequentialRefId(),
      generateUpload: async (inputs) => inputs.map((input) => presigned(input.refId)),
      resolveUpload: async () => undefined,
      onProgress: (progress) => events.push(progress),
    });

    expect(events.map((event) => event.stage)).toEqual([
      'GENERATING',
      'UPLOADING',
      'UPLOADING',
      'UPLOADING',
      'SAVING',
    ]);
    expect(events[events.length - 1]).toMatchObject({ completed: 1, total: 1 });
  });

  it('propagates OperationInfo errors from generate', async () => {
    await expect(
      runPresignedUpload({
        files: [file('a.pdf')],
        generateUpload: async () => {
          throw new OperationInfoError([{ message: 'no permission' }]);
        },
        resolveUpload: async () => undefined,
      }),
    ).rejects.toThrow('no permission');
  });

  it('wraps S3 failures in S3UploadError and does not resolve', async () => {
    uploadFileToS3.mockRejectedValue(new Error('s3 boom'));
    const resolveUpload = vi.fn(async () => undefined);

    await expect(
      runPresignedUpload({
        files: [file('a.pdf')],
        generateUpload: async (inputs) => inputs.map((input) => presigned(input.refId)),
        resolveUpload,
      }),
    ).rejects.toBeInstanceOf(S3UploadError);

    expect(resolveUpload).not.toHaveBeenCalled();
  });

  it('persists only the successful files when failFast is false', async () => {
    uploadFileToS3
      .mockRejectedValueOnce(new Error('s3 boom'))
      .mockResolvedValueOnce({ key: 'k' });
    const resolveUpload = vi.fn(async () => undefined);
    const errors: unknown[] = [];

    await runPresignedUpload({
      files: [file('a.pdf'), file('b.pdf')],
      generateRefId: sequentialRefId(),
      generateUpload: async (inputs) => inputs.map((input) => presigned(input.refId)),
      resolveUpload,
      failFast: false,
      onProgress: (progress) => {
        if (progress.status === 'error') {
          errors.push(progress.error);
        }
      },
    });

    expect(errors).toHaveLength(1);
    expect(resolveUpload).toHaveBeenCalledTimes(1);

    const saved = resolveUpload.mock.calls[0][0] as TSavedUpload[];
    expect(saved).toHaveLength(1);
    expect(saved[0].filename).toBe('b.pdf');
  });

  it('throws when every file fails and failFast is false', async () => {
    uploadFileToS3.mockRejectedValue(new Error('s3 boom'));

    await expect(
      runPresignedUpload({
        files: [file('a.pdf')],
        generateUpload: async (inputs) => inputs.map((input) => presigned(input.refId)),
        resolveUpload: async () => undefined,
        failFast: false,
      }),
    ).rejects.toBeInstanceOf(PresignedUploadError);
  });

  it('throws when no files are provided', async () => {
    await expect(
      runPresignedUpload({
        files: [],
        generateUpload: async () => [],
        resolveUpload: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(PresignedUploadError);
  });

  it('throws UploadAbortedError when the signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runPresignedUpload({
        files: [file('a.pdf')],
        signal: controller.signal,
        generateUpload: async (inputs) =>
          inputs.map((input) => presigned(input.refId)),
        resolveUpload: async () => undefined,
      }),
    ).rejects.toBeInstanceOf(UploadAbortedError);
  });

  it('reports the refId/file manifest before generating', async () => {
    uploadFileToS3.mockResolvedValue({ key: 'k' });
    const manifest = vi.fn();

    await runPresignedUpload({
      files: [file('a.pdf'), file('b.pdf')],
      generateRefId: sequentialRefId(),
      generateUpload: async (inputs) =>
        inputs.map((input) => presigned(input.refId)),
      resolveUpload: async () => undefined,
      onManifest: manifest,
    });

    expect(manifest).toHaveBeenCalledTimes(1);
    expect(manifest.mock.calls[0][0]).toEqual([
      { refId: 'ref-0', file: file('a.pdf') },
      { refId: 'ref-1', file: file('b.pdf') },
    ]);
  });

  it('forwards byte-level progress from the transport, throttled to 1% steps', async () => {
    uploadFileToS3.mockImplementation(({ onProgress }: { onProgress?: (p: { bytesSent: number; totalBytes: number }) => void }) => {
      onProgress?.({ bytesSent: 250, totalBytes: 1000 });
      onProgress?.({ bytesSent: 500, totalBytes: 1000 });
      onProgress?.({ bytesSent: 505, totalBytes: 1000 }); // same 50% → dropped
      onProgress?.({ bytesSent: 1000, totalBytes: 1000 });
      return Promise.resolve({ key: 'k' });
    });

    const events: TUploadProgress[] = [];

    await runPresignedUpload({
      files: [file('a.pdf')],
      generateRefId: sequentialRefId(),
      generateUpload: async (inputs) =>
        inputs.map((input) => presigned(input.refId)),
      resolveUpload: async () => undefined,
      onProgress: (progress) => events.push(progress),
    });

    const byteEvents = events.filter((event) => event.status === 'uploading');
    expect(byteEvents.map((event) => event.bytesSent)).toEqual([250, 500, 1000]);
    expect(byteEvents[0]).toMatchObject({
      refId: 'ref-0',
      status: 'uploading',
      totalBytes: 1000,
    });
  });

  it('artificially delays each stage when simulateDelayMs is set', async () => {
    vi.useFakeTimers();

    try {
      uploadFileToS3.mockResolvedValue({ key: 'k' });
      const resolveUpload = vi.fn(async () => undefined);
      const events: TUploadProgress[] = [];

      const promise = runPresignedUpload({
        files: [file('a.pdf')],
        generateRefId: sequentialRefId(),
        generateUpload: async (inputs) =>
          inputs.map((input) => presigned(input.refId)),
        resolveUpload,
        simulateDelayMs: 1000,
        onProgress: (progress) => events.push(progress),
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(events.map((event) => event.stage)).toEqual([
        'GENERATING',
        'UPLOADING',
        'UPLOADING',
        'UPLOADING',
        'SAVING',
      ]);
      expect(resolveUpload).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws when the upload response does not match the requested files', async () => {
    uploadFileToS3.mockResolvedValue({ key: 'k' });

    await expect(
      runPresignedUpload({
        files: [file('a.pdf'), file('b.pdf')],
        generateUpload: async () => [presigned('ref-0')],
        resolveUpload: async () => undefined,
      }),
    ).rejects.toThrow('did not match requested files');
  });

  describe('unwrapPayload', () => {
    it('returns the success payload', () => {
      const payload = {
        __typename: 'AuthorizedPresignedS3UploadType' as const,
        refId: 'r',
        url: 'u',
        fields: {},
        presignedKey: 'k',
        uploadToken: 't',
      };

      const result = unwrapPayload(
        payload,
        'generate',
        'AuthorizedPresignedS3UploadType',
      );

      expect(result.refId).toBe('r');
    });

    it('throws OperationInfoError for OperationInfo payloads', () => {
      const payload = {
        __typename: 'OperationInfo' as const,
        messages: [{ message: 'invalid' }],
      };

      expect(() =>
        unwrapPayload(payload, 'generate', 'AuthorizedPresignedS3UploadType'),
      ).toThrow('invalid');
    });

    it('throws PresignedUploadError for unexpected payload types', () => {
      const payload = {
        __typename: 'SomethingElse' as const,
        value: 1,
      };

      expect(() =>
        unwrapPayload(payload, 'generate', 'AuthorizedPresignedS3UploadType'),
      ).toThrow('Unexpected generate response type');
    });

    it('throws PresignedUploadError when the payload is missing', () => {
      expect(() =>
        unwrapPayload(null, 'generate', 'AuthorizedPresignedS3UploadType'),
      ).toThrow('Missing generate response');
    });
  });
});
