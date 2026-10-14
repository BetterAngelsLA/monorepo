import * as SecureStore from 'expo-secure-store';

/**
 * Native half of the remembered-email store; `rememberedEmailStorage.web.ts` is
 * its counterpart and must export the same three functions.
 *
 * The `.web` pair — rather than a `Platform.OS` branch — is what keeps
 * `expo-secure-store` out of the web bundle, so the hook reaches storage only
 * through this seam.
 */
export async function loadRememberedEmail(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function saveRememberedEmail(
  key: string,
  value: string,
): Promise<void> {
  // AFTER_FIRST_UNLOCK, not the default WHEN_UNLOCKED, so a remembered address
  // stays readable while the device is locked after a restart.
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearRememberedEmail(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
