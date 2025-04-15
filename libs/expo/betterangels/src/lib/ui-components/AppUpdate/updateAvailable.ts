import * as Updates from 'expo-updates';

const isLocalEnv = process.env.NODE_ENV === 'development';

export async function updateAvailable() {
  if (isLocalEnv) {
    return false;
  }

  try {
    const newUpdateStatus: Updates.UpdateCheckResult =
      await Updates.checkForUpdateAsync();

    return newUpdateStatus.isAvailable;
  } catch (e) {
    console.log(e);

    return false;
  }
}
