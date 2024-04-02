export type ReactNativeFileSubstitute = {
  uri: string;
  name: string;
  type: string;
};

export class ReactNativeFile {
  uri: string;
  name: string;
  type: string;

  /**
   * Creates an instance of ReactNativeFile.
   * @param {ReactNativeFileSubstitute} file A React Native `File` substitute.
   */
  constructor({ uri, name, type }: ReactNativeFileSubstitute) {
    this.uri = uri;
    this.name = name;
    this.type = type;
  }
}

export function customIsExtractableFile(
  value: unknown
): value is ReactNativeFile {
  return value instanceof ReactNativeFile;
}
