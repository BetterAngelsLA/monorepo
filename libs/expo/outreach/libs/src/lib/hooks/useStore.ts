import * as SecureStore from 'expo-secure-store';

export default function useStore() {
  async function saveStore(key: string, value: string) {
    return await SecureStore.setItemAsync(key, value);
  }

  async function getStore(key: string) {
    const result = await SecureStore.getItemAsync(key);
    if (result) {
      return result;
    } else {
      throw new Error('No key found');
    }
  }

  return {
    saveStore,
    getStore,
  };
}
