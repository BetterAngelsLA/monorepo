import * as Updates from 'expo-updates';

const isLocalEnv = process.env.NODE_ENV === 'development';

export async function checkForUpdate() {
  if (isLocalEnv) {
    return false;
  }

  try {
    const update = await Updates.checkForUpdateAsync();

    return update.isAvailable;
  } catch (e) {
    console.log(e);

    return false;
  }
}
