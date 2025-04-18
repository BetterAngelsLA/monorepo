import * as Updates from 'expo-updates';

export async function checkForUpdate() {
  const { channel, checkForUpdateAsync } = Updates;

  if (channel !== 'production') {
    return {} as Updates.UpdateCheckResult;
  }

  try {
    return await checkForUpdateAsync();
  } catch (e) {
    return {} as Updates.UpdateCheckResult;
  }
}
