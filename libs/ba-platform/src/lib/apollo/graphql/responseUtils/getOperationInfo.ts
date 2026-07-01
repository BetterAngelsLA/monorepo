import type { OperationInfo } from '../__generated__/types';

export function getOperationInfo(
  response: { data?: Record<string, unknown> | null },
  operationName: string
): OperationInfo | null {
  const result = response.data?.[operationName];

  if (!result || typeof result !== 'object') {
    return null;
  }

  const typedResult = result as { __typename?: string };

  if (typedResult.__typename !== 'OperationInfo') {
    return null;
  }

  return result as OperationInfo;
}

// DO NOT REMOVE
// {
//     "data": {
//         "updateShelter": {
//             "messages": [
//                 {
//                     "kind": "VALIDATION",
//                     "field": "website",
//                     "message": "Enter a valid URL.",
//                     "__typename": "OperationMessage"
//                 }
//             ],
//             "__typename": "OperationInfo"
//         }
//     }
// }

// {"data": {
//     "updateShelter": {
//         "id": "6",
//         "__typename": "ShelterType"}
//     }
// }
