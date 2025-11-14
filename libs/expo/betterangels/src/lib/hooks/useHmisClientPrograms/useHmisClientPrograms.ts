import { useCallback, useMemo, useState } from 'react';
import { HmisEnrollmentType } from '../../apollo';
import { useHmisClientProgramEnrollmentsQuery } from './__generated__/hmisClientProgramEnrollments.generated';
import { parseError } from './utils/parseError';

const MAX_PROGRAMS_TO_FETCH = 50;

type TProgramsBase = {
  programs?: HmisEnrollmentType[];
  error?: string;
};

type TProps = {
  hmisClientId: string;
};

export function useHmisClientPrograms(props: TProps) {
  const { hmisClientId } = props;

  // track only fresh value from network (not cache) to prevent stale error messaging
  const [totalProgramsFromNetwork, setTotalProgramsFromNetwork] = useState<
    number | undefined
  >(undefined);

  const { data, loading } = useHmisClientProgramEnrollmentsQuery({
    skip: !hmisClientId,
    variables: {
      personalId: hmisClientId,
      pagination: { page: 1, perPage: MAX_PROGRAMS_TO_FETCH },
      dynamicFields: [],
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    onCompleted: (freshData) => {
      const list = freshData?.hmisListEnrollments;

      if (list?.__typename === 'HmisEnrollmentListType') {
        const total = list.meta?.totalCount;
        const newTotal = typeof total === 'number' ? total : undefined;

        setTotalProgramsFromNetwork(newTotal);
      }
    },
    onError: () => {
      // If the network failed, we don't trust cached total; keep undefined
      setTotalProgramsFromNetwork(undefined);
    },
  });

  const { programs, error } = useMemo<TProgramsBase>(() => {
    // handle errors
    if (!hmisClientId) {
      console.error('useHmisClientPrograms: missing hmisClientId');

      return { error: 'missing hmisClientId' };
    }

    const list = data?.hmisListEnrollments;

    if (list?.__typename === 'HmisListEnrollmentsError') {
      const { message } = parseError(list.message);
      const errMsg = message || 'unknown HmisListEnrollmentsError error';

      console.error(`useHmisClientPrograms: ${errMsg}`);

      return { error: errMsg };
    }

    if (list && list.__typename !== 'HmisEnrollmentListType') {
      const errMsg = `invalid query result __typename: ${list.__typename}`;

      console.error(`useHmisClientPrograms: ${errMsg}`);

      return {
        error: errMsg,
      };
    }

    // warn if we did not fetch all resutls
    if (
      totalProgramsFromNetwork &&
      totalProgramsFromNetwork > MAX_PROGRAMS_TO_FETCH
    ) {
      console.warn(
        `useHmisClientPrograms: hmis client [${hmisClientId}] has ${totalProgramsFromNetwork} program enrollments (exceeds ${MAX_PROGRAMS_TO_FETCH})`
      );
    }

    const programs: HmisEnrollmentType[] = [];

    const listItems = list?.items || [];

    for (const program of listItems) {
      if (program.__typename !== 'HmisEnrollmentType') {
        console.warn(
          `[useHmisClientPrograms]: invalid program for hmisClientId [${hmisClientId}]`,
          program
        );

        continue;
      }

      programs.push(program);
    }

    return { programs };
  }, [data, hmisClientId, totalProgramsFromNetwork]);

  // map Program project names for easy access
  const programIdToProjectNameMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!programs || programs?.length === 0) {
      return map;
    }

    for (const program of programs) {
      const enrollmentId = program.enrollmentId;
      if (!enrollmentId) {
        continue;
      }

      const projectName = program.project?.projectName;
      if (!projectName) {
        continue;
      }

      map.set(enrollmentId, projectName);
    }

    return map;
  }, [programs]);

  // utility fn to return program name
  const getProgramNameByEnrollmentId = useCallback(
    (enrollmentId?: string | null) => {
      if (!enrollmentId) {
        return undefined;
      }

      return programIdToProjectNameMap.get(enrollmentId);
    },
    [programIdToProjectNameMap]
  );

  return {
    programs,
    totalPrograms: totalProgramsFromNetwork,
    loading,
    error,
    programIdToProjectNameMap,
    getProgramNameByEnrollmentId,
  };
}
