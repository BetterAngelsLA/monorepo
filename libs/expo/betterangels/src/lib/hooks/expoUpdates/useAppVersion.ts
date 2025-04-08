import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

type TAppVersions = {
  version?: string;
  runtimeVersion?: string;
  runtimeVersionShort?: string;
  nativeApplicationVersion: string | null;
};

const nullVersion: TAppVersions = {
  version: undefined,
  runtimeVersion: undefined,
  runtimeVersionShort: undefined,
  nativeApplicationVersion: null,
};

export default function useAppVersion() {
  const [version, setVersion] = useState<TAppVersions>(nullVersion);

  useEffect(() => {
    const { expoConfig, manifest2 } = Constants || {};

    const { nativeApplicationVersion } = Application;

    const version = expoConfig?.version;
    const runtimeVersion = manifest2?.runtimeVersion;
    const trimmedRuntimeVersion = runtimeVersion && runtimeVersion.slice(-4);

    setVersion({
      version,
      runtimeVersion,
      runtimeVersionShort: trimmedRuntimeVersion,
      nativeApplicationVersion,
    });
  }, []);

  return version;
}
