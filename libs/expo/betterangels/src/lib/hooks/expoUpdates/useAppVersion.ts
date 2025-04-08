import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

type TAppVersions = {
  version?: string;
  runtimeVersion?: string;
};

const nullVersion: TAppVersions = {
  version: undefined,
  runtimeVersion: undefined,
};

export default function useAppVersion() {
  const [version, setVersion] = useState<TAppVersions>(nullVersion);

  useEffect(() => {
    const { expoConfig, manifest2 } = Constants || {};

    const version = expoConfig?.version;
    const runtimeVersion = manifest2?.runtimeVersion;

    // TODO: return trimmed version after confirming in DEV env
    // const trimmedRuntimeVersion = runtimeVersion && runtimeVersion.slice(-4);

    setVersion({
      version,
      runtimeVersion,
    });
  }, []);

  return version;
}
