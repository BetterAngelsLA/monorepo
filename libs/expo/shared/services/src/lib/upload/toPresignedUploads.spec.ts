import { toPresignedUploads } from './toPresignedUploads';

describe('toPresignedUploads', () => {
  it('maps backend generate payloads to TPresignedUpload', () => {
    expect(
      toPresignedUploads([
        {
          refId: 'ref-0',
          url: 'https://s3.example.com',
          fields: { key: 'keys/ref-0', 'Content-Type': 'application/pdf' },
          presignedKey: 'keys/ref-0',
          uploadToken: 'token-0',
        },
        {
          refId: 'ref-1',
          url: 'https://s3.example.com',
          fields: { key: 'keys/ref-1' },
          presignedKey: 'keys/ref-1',
          uploadToken: 'token-1',
        },
      ]),
    ).toEqual([
      {
        refId: 'ref-0',
        url: 'https://s3.example.com',
        fields: { key: 'keys/ref-0', 'Content-Type': 'application/pdf' },
        presignedKey: 'keys/ref-0',
        uploadToken: 'token-0',
      },
      {
        refId: 'ref-1',
        url: 'https://s3.example.com',
        fields: { key: 'keys/ref-1' },
        presignedKey: 'keys/ref-1',
        uploadToken: 'token-1',
      },
    ]);
  });

  it('returns an empty array for an empty payload list', () => {
    expect(toPresignedUploads([])).toEqual([]);
  });
});
