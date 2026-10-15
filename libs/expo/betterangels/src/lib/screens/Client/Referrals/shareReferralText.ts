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
  // Static imports match the app's existing document sharing. Metro's lazy
  // native-module chunks do not resolve reliably from this monorepo app root.
  if (!isCurrent()) return;
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('File sharing is unavailable');
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
  const file = new File(directory, `referral-${randomUUID()}.txt`);
  try {
    file.create();
    file.write(copy.text);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
      dialogTitle: 'Save or share referral text file',
    });
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
}
