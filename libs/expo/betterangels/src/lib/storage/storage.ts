import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Utility functions for managing cookies on web platform
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
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const eraseCookie = (name: string) => {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/**
 * Functions for getting and setting items in storage, abstracting the platform-specific logic
 */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getCookie(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    setCookie(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    eraseCookie(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
