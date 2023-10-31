import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * This store is used mainly to handle csrf token management between react native and
 * react web.
 * React web will use the regular cookie store
 * React native will use expo secure store
 */
export default function useAuthStore() {
  async function setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      return setCookie(key, value);
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  }

  async function getItem(key: string) {
    let result;
    if (Platform.OS === 'web') {
      result = getCookie(key);
    } else {
      result = await SecureStore.getItemAsync(key);
    }

    if (result) {
      return result;
    } else {
      throw new Error('No key found');
    }
  }

  async function deleteItem(key: string) {
    if (Platform.OS === 'web') {
      return eraseCookie(key);
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  }

  return {
    setItem,
    getItem,
    deleteItem,
  };
}

/**
 * For web, we store the csrf token and auth related items in cookies
 */
const setCookie = (name: string, value: string, days = 30) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
};

const getCookie = (name: string) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
