import { downloadBlobInBrowser } from '@monorepo/expo/shared/utils';
import { Share, Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import type { ReferralTextCopy } from './referralExport';

function referralFileName(extension: 'txt' | 'png') {
  return `referral-${randomUUID()}.${extension}`;
}

/** Decode the base64 the SVG renderer returns into bytes for a web Blob. */
function pngBytes(base64: string): Uint8Array<ArrayBuffer> {
  if (typeof atob !== 'function')
    throw new Error('This browser cannot decode the referral image');
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Native share results are not evidence that a recipient received anything. */
export async function shareReferralText(copy: ReferralTextCopy) {
  if (Platform.OS === 'web') {
    try {
      // React Native Web forwards this to navigator.share.
      await Share.share(
        { title: copy.title, message: copy.text },
        { subject: copy.title, dialogTitle: 'Share referral text' },
      );
      return;
    } catch (error) {
      // Dismissing the browser share sheet is a user decision, not a failure:
      // do not turn a cancel into a surprise download.
      if ((error as { name?: string } | null)?.name === 'AbortError') return;
      // No Web Share API (most desktop browsers): hand over a text download
      // rather than leaving the button dead.
      if (
        downloadBlobInBrowser(
          copy.text,
          referralFileName('txt'),
          'text/plain',
        )
      )
        return;
      // `new Error(msg, { cause })` needs lib ES2022; the app targets ES2020.
      throw Object.assign(
        new Error('Sharing is unavailable in this browser'),
        { cause: error },
      );
    }
  }

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
  if (Platform.OS === 'web') {
    const data = await content();
    if (!isCurrent()) return;
    const filename = referralFileName(format);
    const downloaded =
      format === 'png'
        ? downloadBlobInBrowser(pngBytes(data), filename, 'image/png')
        : downloadBlobInBrowser(data, filename, 'text/plain');
    if (!downloaded)
      throw new Error('Downloading is unavailable in this browser');
    return;
  }
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
