import { ClientDocumentNamespaceEnum } from '../../../apollo';

/**
 * Folder titles in the Docs tree, matching the Accordion folders rendered by
 * the Docs screen. Single source of truth shared by the tree and the upload
 * flow (which places in-flight rows under the right folder).
 */
export const DOC_FOLDER_TITLES = {
  DOC_READY: 'Doc Ready',
  FORMS: 'Forms',
  OTHER: 'Other',
} as const;

export type TDocFolder =
  (typeof DOC_FOLDER_TITLES)[keyof typeof DOC_FOLDER_TITLES];

/**
 * Maps an upload namespace to the docs-tree folder where its in-flight rows
 * render. Kept in sync with the backend grouping in
 * CLIENT_DOCUMENT_NAMESPACE_GROUPS (clients/types.py).
 */
export function getDocFolder(
  namespace: ClientDocumentNamespaceEnum,
): TDocFolder {
  switch (namespace) {
    case ClientDocumentNamespaceEnum.ConsentForm:
    case ClientDocumentNamespaceEnum.HmisForm:
    case ClientDocumentNamespaceEnum.IncomeForm:
      return DOC_FOLDER_TITLES.FORMS;
    case ClientDocumentNamespaceEnum.OtherClientDocument:
      return DOC_FOLDER_TITLES.OTHER;
    default:
      return DOC_FOLDER_TITLES.DOC_READY;
  }
}
