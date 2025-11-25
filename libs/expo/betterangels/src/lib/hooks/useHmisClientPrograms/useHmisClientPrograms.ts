import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HmisEnrollmentType } from '../../apollo';
import { HmisClientProgramEnrollmentsDocument } from './__generated__/hmisClientProgramEnrollments.generated';
import { parseError } from './utils/parseError';

const MAX_PROGRAMS_TO_FETCH = 50;

type TProgramsBase = {
  enrollments?: HmisEnrollmentType[];
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
  } = useQuery(HmisClientProgramEnrollmentsDocument, {
    skip: !clientId,
    variables: {
      personalId: clientId,
      pagination: { page: 1, perPage: MAX_PROGRAMS_TO_FETCH },
      dynamicFields: [],
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  // update totalProgramsFromNetwork onComplete
  useEffect(() => {
    if (!data) {
      return;
    }

    const list = data.hmisListEnrollments;

    if (list?.__typename === 'HmisEnrollmentListType') {
      const total = list.meta?.totalCount;
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

  const { enrollments, error } = useMemo<TProgramsBase>(() => {
    // handle errors
    if (!clientId) {
      console.error('useHmisClientPrograms: missing clientId');

      return { error: 'missing clientId' };
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
        `useHmisClientPrograms: hmis client [${clientId}] has ${totalProgramsFromNetwork} enrollment enrollments (exceeds ${MAX_PROGRAMS_TO_FETCH})`
      );
    }

    const enrollments: HmisEnrollmentType[] = [];

    const listItems = list?.items || [];

    for (const enrollment of listItems) {
      if (enrollment.__typename !== 'HmisEnrollmentType') {
        console.warn(
          `[useHmisClientPrograms]: invalid enrollment for clientId [${clientId}]`,
          enrollment
        );

        continue;
      }

      enrollments.push(enrollment);
    }

    return { enrollments };
  }, [data, clientId, totalProgramsFromNetwork]);

  // map Program project names for easy access
  const enrollmentIdToProjectNameMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!enrollments || enrollments?.length === 0) {
      return map;
    }

    for (const enrollment of enrollments) {
      const refClientProgram = enrollment.enrollmentId;
      if (!refClientProgram) {
        continue;
      }

      const projectName = enrollment.project?.projectName;
      if (!projectName) {
        continue;
      }

      map.set(refClientProgram, projectName);
    }

    return map;
  }, [enrollments]);

  // utility fn to return enrollment name
  const getProgramNameByEnrollmentId = useCallback(
    (refClientProgram?: string | null) => {
      if (!refClientProgram) {
        return undefined;
      }

      return enrollmentIdToProjectNameMap.get(refClientProgram);
    },
    [enrollmentIdToProjectNameMap]
  );

  return {
    enrollments,
    totalPrograms: totalProgramsFromNetwork,
    loading,
    error,
    enrollmentIdToProjectNameMap,
    getProgramNameByEnrollmentId,
  };
}
