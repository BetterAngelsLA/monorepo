/**
 * Folder titles in the Docs tree, matching the Accordion folders rendered by
 * the Docs screen.
 */
export const DOC_FOLDER_TITLES = {
  DOC_READY: 'Doc Ready',
  FORMS: 'Forms',
  OTHER: 'Other',
} as const;

export type TDocFolder =
  (typeof DOC_FOLDER_TITLES)[keyof typeof DOC_FOLDER_TITLES];
