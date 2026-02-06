import { useS3Upload } from '@monorepo/react/betterangels-admin';
import { useCallback, useRef, useState } from 'react';

/**
 * S3 field IDs registered by django-s3-file-field.
 * These correspond to S3FileField instances declared on Django models.
 */
const FIELD_OPTIONS = [
  { label: 'Interior Photo', value: 'shelters.InteriorPhoto.file' },
  { label: 'Exterior Photo', value: 'shelters.ExteriorPhoto.file' },
  { label: 'Video', value: 'shelters.Video.file' },
] as const;

export function DevFlyout() {
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState(FIELD_OPTIONS[0].value);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { upload, progress, status, error, abort } = useS3Upload();

  const handleUpload = useCallback(async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setResult(null);
    try {
      const fieldValue = await upload(file, fieldId);
      setResult(fieldValue);
    } catch {
      // error state is handled by the hook
    }
  }, [upload, fieldId]);

  // Only render in development
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Toggle tab */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-indigo-600 text-white px-2 py-3 rounded-l-md text-xs font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {open ? 'Close' : '⚙ Dev'}
      </button>

      {/* Flyout panel */}
      {open && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 overflow-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">
              <span role="img" aria-label="test tube">
                🧪
              </span>{' '}
              Dev Tools
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4 flex-1">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              Direct-to-S3 Upload Demo
            </h3>

            <p className="text-xs text-gray-500">
              Uploads a file directly to S3/MinIO using the REST API at{' '}
              <code className="bg-gray-100 px-1 rounded">/api/s3-upload/</code>.
              No custom GraphQL mutation needed.
            </p>

            {/* Field selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Field
              </label>
              <select
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <input
                ref={fileRef}
                type="file"
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Upload button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={status === 'uploading' || status === 'completing'}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'uploading'
                  ? `Uploading ${progress}%`
                  : status === 'completing'
                  ? 'Completing...'
                  : 'Upload to S3'}
              </button>

              {(status === 'uploading' || status === 'completing') && (
                <button
                  type="button"
                  onClick={abort}
                  className="bg-red-100 text-red-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Progress bar */}
            {(status === 'uploading' || status === 'completing') && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Error display */}
            {status === 'error' && error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <span role="img" aria-label="error">
                  ❌
                </span>{' '}
                {error}
              </div>
            )}

            {/* Success display */}
            {status === 'done' && result && (
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                  <span role="img" aria-label="success">
                    ✅
                  </span>{' '}
                  Upload complete!
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Signed field_value (use in GraphQL mutations)
                  </label>
                  <textarea
                    readOnly
                    value={result}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-mono bg-gray-50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 space-y-2">
              <p className="font-semibold">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <strong>Initialize</strong> — POST to{' '}
                  <code>/api/s3-upload/upload-initialize/</code> with field_id,
                  file metadata
                </li>
                <li>
                  <strong>Upload parts</strong> — PUT each part directly to the
                  presigned S3 URL
                </li>
                <li>
                  <strong>Complete</strong> — POST to{' '}
                  <code>/api/s3-upload/upload-complete/</code>, then POST to S3
                  complete URL
                </li>
                <li>
                  <strong>Finalize</strong> — POST to{' '}
                  <code>/api/s3-upload/finalize/</code> → returns signed
                  field_value
                </li>
              </ol>
              <p>
                The signed <code>field_value</code> can then be passed to any
                GraphQL mutation that accepts a file field.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
