import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export default function useAppVersion() {
  return {
    version: Constants.expoConfig?.version,
    runtimeVersion: Constants.manifest2?.runtimeVersion,
    runtimeVersionShort: Constants.manifest2?.runtimeVersion?.slice(-12),
    nativeApplicationVersion: Application.nativeApplicationVersion,
    otaUpdateId: Updates.updateId,
    otaUpdateIdShort: Updates.updateId?.slice(-12),
  };
}
