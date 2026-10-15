import { Share } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import type { ReferralTextCopy } from './referralExport';

/** Native share results are not evidence that a recipient received anything. */
export async function shareReferralText(copy: ReferralTextCopy) {
  await Share.share(
    { title: copy.title, message: copy.text },
    { subject: copy.title, dialogTitle: 'Share referral text' },
  );
}

export async function shareReferralTextFile(
  copy: ReferralTextCopy,
  isCurrent: () => boolean,
) {
  await shareReferralFile(() => copy.text, 'txt', isCurrent);
}

/** Capture only the reviewed SVG, never the phone screen or surrounding UI. */
export async function shareReferralPng(
  capture: () => Promise<string>,
  isCurrent: () => boolean,
) {
  await shareReferralFile(
    async () => {
      const base64 = (await capture()).replace(/\s/g, '');
      if (
        base64.length < 44 ||
        base64.length > 16 * 1024 * 1024 ||
        !/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
        base64.length % 4 !== 0
      ) {
        throw new Error(
          'The renderer did not return a valid PNG image. Try text sharing.',
        );
      }
      return base64;
    },
    'png',
    isCurrent,
  );
}

async function shareReferralFile(
  content: () => string | Promise<string>,
  format: 'txt' | 'png',
  isCurrent: () => boolean,
) {
  // Static imports match the app's existing document sharing. Metro's lazy
  // native-module chunks do not resolve reliably from this monorepo app root.
  if (!isCurrent()) return;
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('File sharing is unavailable');
  if (!isCurrent()) return;
  const data = await content();
  if (!isCurrent()) return;
  const directory = new Directory(Paths.cache, 'referral-exports');
  directory.create({ idempotent: true, intermediates: true });
  // Android may read the file after the chooser closes. Keep recent handoffs;
  // prune only this feature's expired cache files on the next file export.
  const expiry = Date.now() - 24 * 60 * 60 * 1000;
  for (const item of directory.list()) {
    if (
      item instanceof File &&
      item.modificationTime !== null &&
      item.modificationTime < expiry
    )
      item.delete();
  }
  const file = new File(directory, `referral-${randomUUID()}.${format}`);
  try {
    file.create();
    file.write(data, { encoding: format === 'png' ? 'base64' : 'utf8' });
    await Sharing.shareAsync(file.uri, {
      mimeType: format === 'png' ? 'image/png' : 'text/plain',
      UTI: format === 'png' ? 'public.png' : 'public.plain-text',
      dialogTitle:
        format === 'png'
          ? 'Save or share referral image'
          : 'Save or share referral text file',
    });
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
}
