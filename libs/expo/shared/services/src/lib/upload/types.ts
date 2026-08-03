export type TUploadFile = {
  uri: string;
  name: string;
  type: string;
};

/** Input sent to the backend to request presigned POSTs (correlated by refId). */
export type TUploadInput = {
  refId: string;
  filename: string;
  contentType: string;
};

/** A presigned POST returned by the backend, ready for a direct S3 upload. */
export type TPresignedUpload = {
  refId: string;
  url: string;
  fields: Record<string, string>;
  presignedKey: string;
  uploadToken: string;
};

/** A successfully uploaded file, persisted via the resolve step. */
export type TSavedUpload = {
  presignedKey: string;
  filename: string;
  contentType: string;
  uploadToken: string;
};

export type TUploadStage = 'GENERATING' | 'UPLOADING' | 'SAVING';

export type TUploadFileStatus = 'started' | 'done' | 'error';

export type TUploadProgress = {
  stage: TUploadStage;
  /** Number of files whose S3 upload has completed. */
  completed: number;
  total: number;
  refId?: string;
  status?: TUploadFileStatus;
  error?: unknown;
};
