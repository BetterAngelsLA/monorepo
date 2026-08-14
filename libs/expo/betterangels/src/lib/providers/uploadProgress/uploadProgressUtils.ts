import { TUploadItem, TUploadSession } from './uploadProgressTypes';

/** 0-100 progress percentage for an in-flight item, or null when unknown. */
export function uploadProgressPct(item: TUploadItem): number | null {
  if (
    item.status !== 'uploading' ||
    typeof item.totalBytes !== 'number' ||
    item.totalBytes <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.round(((item.bytesSent ?? 0) / item.totalBytes) * 100),
  );
}

/** Aggregate item counts across in-flight sessions (for the global bar). */
export function aggregateUploadCounts(sessions: TUploadSession[]): {
  totalItems: number;
  completedItems: number;
  failed: boolean;
} {
  const initial: {
    totalItems: number;
    completedItems: number;
    failed: boolean;
  } = { totalItems: 0, completedItems: 0, failed: false };

  return sessions.reduce(
    (counts, session) => ({
      totalItems: counts.totalItems + session.items.length,
      completedItems: counts.completedItems + session.completed,
      failed: counts.failed || session.failed,
    }),
    initial,
  );
}
