// Base Hmis Client error
export class HmisError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = 'HmisError';
  }
}

// HmisFileError
export const HmisFileErrorCode = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type HmisFileErrorCode =
  (typeof HmisFileErrorCode)[keyof typeof HmisFileErrorCode];

export class HmisFileError extends HmisError {
  readonly code: HmisFileErrorCode;

  constructor(
    message: string,
    status: number,
    code: HmisFileErrorCode,
    data?: unknown
  ) {
    super(message, status, data);
    this.name = 'HmisFileError';
    this.code = code;
  }
}

export type HmisInvalidFileTypeErrorData = {
  received?: string;
  allowed?: readonly string[];
};

export class HmisInvalidFileTypeError extends HmisFileError {
  override readonly data?: HmisInvalidFileTypeErrorData;

  constructor(
    message: string,
    status: number,
    data?: HmisInvalidFileTypeErrorData
  ) {
    super(message, status, HmisFileErrorCode.INVALID_FILE_TYPE, data);
    this.name = 'HmisInvalidFileTypeError';
  }
}
