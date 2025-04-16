import * as Updates from 'expo-updates';

export async function checkForUpdate() {
  const { channel, checkForUpdateAsync } = Updates;

  if (channel !== 'production') {
    return {} as Updates.UpdateCheckResult;
  }

  try {
    const update = await checkForUpdateAsync();

    return update;
  } catch (e) {
    console.error(e);

    return {} as Updates.UpdateCheckResult;
  }
}
