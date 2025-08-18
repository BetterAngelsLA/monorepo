type TFilenameResult = {
  filename: string;
  dirs: string[];
};

type TProps = {
  filePath: string;
  dirLevel?: number;
  stripExtension?: boolean;
  ignoreDirName?: string;
};

export function extractFilename(props: TProps): TFilenameResult {
  const { filePath, dirLevel, stripExtension, ignoreDirName } = props;

  const parts = filePath.split('/');
  const fileWithExt = parts.pop()!;

  const filename = stripExtension
    ? stripFileExtension(fileWithExt)
    : fileWithExt;

  const dirNames = parts.filter((name) => {
    const ignoredDirname = ignoreDirName?.toLowerCase() || '';

    return name.toLowerCase() !== ignoredDirname;
  });

  let dirs: string[] = [];

  if (dirLevel) {
    dirs = dirNames.slice(-dirLevel);
  }

  return {
    filename,
    dirs,
  };
}

export function stripFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');

  return idx === -1 ? name : name.slice(0, idx);
}
