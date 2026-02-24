// HMIS error - base
export class ErrorHmis extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = 'ErrorHmis';
  }
}

// HMIS File Errors
export const FileErrorCodeHmis = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type FileErrorCodeHmis =
  (typeof FileErrorCodeHmis)[keyof typeof FileErrorCodeHmis];

export class FileErrorHmis extends ErrorHmis {
  readonly code: FileErrorCodeHmis;

  constructor(
    message: string,
    status: number,
    code: FileErrorCodeHmis,
    data?: unknown
  ) {
    super(message, status, data);
    this.name = 'FileErrorHmis';
    this.code = code;
  }
}

export type InvalidFileTypeErrorDataHmis = {
  received?: string;
  allowed?: readonly string[];
};

export class InvalidFileTypeErrorHmis extends FileErrorHmis {
  override readonly data?: InvalidFileTypeErrorDataHmis;

  constructor(
    message: string,
    status: number,
    data?: InvalidFileTypeErrorDataHmis
  ) {
    super(message, status, FileErrorCodeHmis.INVALID_FILE_TYPE, data);
    this.name = 'InvalidFileTypeErrorHmis';
  }
}
