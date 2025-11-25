import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HmisClientProgramType } from '../../apollo';
import { HmisClientProgramsDocument } from './__generated__/hmisClientPrograms.generated';

const MAX_PROGRAMS_TO_FETCH = 50;

type TProgramsBase = {
  clientPrograms?: HmisClientProgramType[];
  error?: string;
};

type TProps = {
  clientId: string;
};

export function useHmisClientPrograms(props: TProps) {
  const { clientId } = props;

  // track only fresh value from network (not cache) to prevent stale error messaging
  const [totalProgramsFromNetwork, setTotalProgramsFromNetwork] = useState<
    number | undefined
  >(undefined);

  const {
    data,
    loading,
    error: queryError,
  } = useQuery(HmisClientProgramsDocument, {
    skip: !clientId,
    variables: { clientId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  // update totalProgramsFromNetwork onComplete
  useEffect(() => {
    if (!data) {
      return;
    }

    const list = data.hmisClientPrograms;

    if (list?.length === 0) {
      return;
    }

    if (list[0].__typename === 'HmisClientProgramType') {
      const total = list.length;
      const newTotal = typeof total === 'number' ? total : undefined;

      setTotalProgramsFromNetwork(newTotal);
    }
  }, [data, setTotalProgramsFromNetwork]);

  // update totalProgramsFromNetwork onError
  useEffect(() => {
    if (queryError) {
      setTotalProgramsFromNetwork(undefined);
    }
  }, [queryError, setTotalProgramsFromNetwork]);

  const { clientPrograms, error } = useMemo<TProgramsBase>(() => {
    // handle errors
    if (!clientId) {
      console.error('useHmisClientPrograms: missing clientId');

      return { error: 'missing clientId' };
    }

    const list = data?.hmisClientPrograms;

    if (!list || list?.length === 0) {
      return;
    }

    // warn if we did not fetch all resutls
    if (
      totalProgramsFromNetwork &&
      totalProgramsFromNetwork > MAX_PROGRAMS_TO_FETCH
    ) {
      console.warn(
        `useHmisClientPrograms: hmis client [${clientId}] has ${totalProgramsFromNetwork} clientProgram clientPrograms (exceeds ${MAX_PROGRAMS_TO_FETCH})`
      );
    }

    const clientPrograms: HmisClientProgramType[] = [];

    for (const clientProgram of list) {
      if (clientProgram.__typename !== 'HmisClientProgramType') {
        console.warn(
          `[useHmisClientPrograms]: invalid clientProgram for clientId [${clientId}]`,
          clientProgram
        );

        continue;
      }

      clientPrograms.push(clientProgram);
    }

    return { clientPrograms };
  }, [data, clientId, totalProgramsFromNetwork]);

  // map Program project names for easy access
  const enrollmentIdToProjectNameMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!clientPrograms || clientPrograms?.length === 0) {
      return map;
    }

    for (const clientProgram of clientPrograms) {
      const refClientProgram = clientProgram.id;
      if (!refClientProgram) {
        continue;
      }

      const projectName = clientProgram.program?.name;
      if (!projectName) {
        continue;
      }

      map.set(refClientProgram, projectName);
    }

    return map;
  }, [clientPrograms]);

  // utility fn to return clientProgram name
  const getProgramNameByEnrollmentId = useCallback(
    (refClientProgram?: string | null) => {
      if (!refClientProgram) {
        return undefined;
      }

      return enrollmentIdToProjectNameMap.get(refClientProgram);
    },
    [enrollmentIdToProjectNameMap]
  );

  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&clientPrograms');
  console.log(clientPrograms);
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&totalProgramsFromNetwork');
  console.log(totalProgramsFromNetwork);
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&loading');
  console.log(loading);
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&error');
  console.log(error);
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&enrollmentIdToProjectNameMap');
  console.log(enrollmentIdToProjectNameMap);

  return {
    clientPrograms,
    totalPrograms: totalProgramsFromNetwork,
    loading,
    error,
    enrollmentIdToProjectNameMap,
    getProgramNameByEnrollmentId,
  };
}
