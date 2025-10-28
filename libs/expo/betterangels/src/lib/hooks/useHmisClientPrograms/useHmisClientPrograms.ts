import { useMemo, useState } from 'react';
import { useHmisClientProgramEnrollmentsQuery } from './__generated__/hmisClientProgramEnrollments.generated';
import { parseError } from './utils/parseError';

const MAX_PROGRAMS_TO_FETCH = 50;

type UseHmisClientProgramsResult = {
  programs?: THmisClientProgram[];
  error?: string;
  totalPrograms?: number | null;
};

type THmisClientProgram = {
  id: string;
  name: string;
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

  const { programs, error } = useMemo<UseHmisClientProgramsResult>(() => {
    // handle errors
    if (!hmisClientId) {
      console.error('useHmisClientPrograms: missing hmisClientId');

      return { error: 'missing hmisClientId' };
    }

    const list = data?.hmisListEnrollments;

    if (list && list.__typename === 'HmisListEnrollmentsError') {
      const { message } = parseError(list.message);
      const errMsg = message || 'unknown HmisListEnrollmentsError error';

      console.error(`useHmisClientPrograms: ${errMsg}`);

      return { error: errMsg };
    }

    if (list && list.__typename !== 'HmisEnrollmentListType') {
      const errMsg = `invalid query result __typename: ${list?.__typename}`;

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

    // // success
    const programs: THmisClientProgram[] = [];

    const listItems = list?.items || [];

    for (const item of listItems) {
      if (item.__typename !== 'HmisEnrollmentType') {
        console.warn(
          `[useHmisClientPrograms]: invalid program for hmisClientId [${hmisClientId}]`,
          item
        );

        continue;
      }

      const { enrollmentId, project } = item;
      const projectName = project?.projectName;

      if (!enrollmentId || !projectName) {
        console.warn(
          `[useHmisClientPrograms] Skipping enrollment for hmisClientId [${hmisClientId}] with missing data`,
          { enrollmentId, projectName, item }
        );

        continue;
      }

      programs.push({ id: enrollmentId, name: projectName });
    }

    return { programs };
  }, [data, hmisClientId]);

  return {
    programs,
    totalPrograms: totalProgramsFromNetwork,
    loading,
    error,
  };
}
