import { router } from 'expo-router';

export type TRedirectHandler = {
  authPath: string;
  safeOperations?: string[];
  onUnauthenticated?: (() => void) | null;
};

export function createRedirectHandler({
  authPath,
  safeOperations,
  onUnauthenticated,
}: TRedirectHandler) {
  let redirectInFlight = false;

  const safeOperationsSet = new Set(safeOperations);

  return (operationName: string) => {
    const ignoreOperation = safeOperationsSet.has(operationName);

    if (ignoreOperation || onUnauthenticated === null || redirectInFlight) {
      return;
    }

    redirectInFlight = true;

    try {
      // Custom hook wins
      if (onUnauthenticated) {
        onUnauthenticated();

        return;
      }

      // Otherwise redirect to auth
      if (router.canGoBack?.()) {
        router.dismissAll?.();
      }

      router.replace(authPath);
    } finally {
      // release next macrotask to dedupe concurrent errors
      setTimeout(() => {
        redirectInFlight = false;
      }, 0);
    }
  };
}
