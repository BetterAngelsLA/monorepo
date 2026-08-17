import { ReactNativeFile } from '@monorepo/expo/shared/clients';
import { useEffect, useRef } from 'react';
import { ClientDocumentNamespaceEnum } from '../../../apollo';
import {
  canReusePresign,
  completeUploadSession,
  deleteUploadManifest,
  failUploadSession,
  loadResumableManifests,
  startUploadSession,
  type TPersistedUploadSession,
} from '../../../providers';
import { useClientDocumentUpload } from './UploadModal/useClientDocumentUpload';
import { useDocsUpload } from './useDocsUpload';

/**
 * Finishes client-document uploads that were interrupted by the app being
 * killed.
 *
 * The upload pipeline is generate → send to S3 → save. Only the first and
 * last steps need the app alive, but the *save* is what actually creates the
 * document record — so a process death between S3 accepting a file and the
 * save landing leaves an object in the bucket that nothing references and
 * the user never hears about again. No amount of background transport fixes
 * that, because the save is a GraphQL call that cannot run without a JS
 * runtime. Recovery has to happen on the next launch, from a manifest
 * written before anything was sent.
 *
 * Two recovery paths, chosen per file:
 *  - bytes already in S3 and the presigned credentials are still inside
 *    their ~5 minute window → save only, no re-upload.
 *  - anything else → re-upload from the local file, which needs a fresh
 *    presigned POST because the stored one has expired.
 */
export function useResumeDocsUploads(enabled: boolean) {
  const { resolveUploadedDocuments } = useClientDocumentUpload();
  const { startSession } = useDocsUpload();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    void resume({ resolveUploadedDocuments, startSession });
  }, [enabled, resolveUploadedDocuments, startSession]);
}

async function resume({
  resolveUploadedDocuments,
  startSession,
}: {
  resolveUploadedDocuments: (args: {
    clientProfileId: string;
    namespace: ClientDocumentNamespaceEnum;
    saved: Array<{
      presignedKey: string;
      filename: string;
      contentType: string;
      uploadToken: string;
    }>;
  }) => Promise<void>;
  startSession: (
    files: ReactNativeFile[],
    namespace: ClientDocumentNamespaceEnum,
    title: string,
    clientProfileId: string,
  ) => void;
}) {
  const now = Date.now();
  const manifests = await loadResumableManifests(now);

  for (const manifest of manifests) {
    await resumeOne(manifest, now, {
      resolveUploadedDocuments,
      startSession,
    });
  }
}

async function resumeOne(
  manifest: TPersistedUploadSession,
  now: number,
  handlers: {
    resolveUploadedDocuments: (args: {
      clientProfileId: string;
      namespace: ClientDocumentNamespaceEnum;
      saved: Array<{
        presignedKey: string;
        filename: string;
        contentType: string;
        uploadToken: string;
      }>;
    }) => Promise<void>;
    startSession: (
      files: ReactNativeFile[],
      namespace: ClientDocumentNamespaceEnum,
      title: string,
      clientProfileId: string,
    ) => void;
  },
) {
  const { resolveUploadedDocuments, startSession } = handlers;
  const namespace = manifest.namespace as ClientDocumentNamespaceEnum;
  const unfinished = manifest.items.filter((item) => item.status !== 'done');

  const savable = unfinished.filter((item) =>
    canReusePresign(manifest, item, now),
  );
  const reuploadable = unfinished.filter(
    (item) => !canReusePresign(manifest, item, now),
  );

  if (savable.length) {
    // Surface the recovery so a document appearing "by itself" is explained.
    const sessionId = `${manifest.id}-resume`;

    startUploadSession(
      sessionId,
      savable.map((item) => item.name),
      {
        label: manifest.label,
        clientId: manifest.clientProfileId,
        refIds: savable.map((item) => item.refId),
        files: savable.map((item) => ({ uri: item.uri, type: item.mimeType })),
      },
    );

    try {
      await resolveUploadedDocuments({
        clientProfileId: manifest.clientProfileId,
        namespace,
        saved: savable.map((item) => ({
          presignedKey: item.presignedKey as string,
          filename: item.name,
          contentType: item.mimeType,
          uploadToken: item.uploadToken as string,
        })),
      });

      completeUploadSession(sessionId);
    } catch (err) {
      console.error(`[useResumeDocsUploads resolve error:] ${err}`);
      // The credentials went stale between the window check and the call;
      // the file has to go back through a full upload.
      failUploadSession(
        sessionId,
        'Could not finish an interrupted upload. Please upload the file again.',
      );
    }
  }

  if (reuploadable.length) {
    startSession(
      reuploadable.map((item) => ({
        uri: item.uri,
        name: item.name,
        type: item.mimeType,
      })) as ReactNativeFile[],
      namespace,
      manifest.label ?? 'Documents',
      manifest.clientProfileId,
    );
  }

  // The resumed work now owns its own manifest (startSession writes a fresh
  // one); this record has served its purpose either way.
  await deleteUploadManifest(manifest.id);
}
