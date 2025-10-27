import { useMemo } from 'react';
import { useHmisClientProgramEnrollmentsQuery } from './__generated__/hmisClientProgramEnrollments.generated';

// Per hmis api:: Per Page must be no greater than 1000
// if as_array=1 and no greater than 50 otherwise
// Not paginating for now, assume some max number
const MAX_PROGRAMS_TO_FETCH = 50;

type THmisClientProgram = {
  id: string;
  name: string;
};

type TProps = {
  hmisClientId: string;
};

export function useHmisClientPrograms(props: TProps) {
  const { hmisClientId } = props;

  const { data, loading, error } = useHmisClientProgramEnrollmentsQuery({
    skip: !hmisClientId,
    variables: {
      personalId: hmisClientId,
      pagination: { page: 1, perPage: MAX_PROGRAMS_TO_FETCH },
      dynamicFields: [],
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const programs: THmisClientProgram[] = useMemo(() => {
    if (!hmisClientId) {
      return [];
    }

    const list = data?.hmisListEnrollments;

    if (list?.__typename !== 'HmisEnrollmentListType') {
      return [];
    }

    const validPrograms: THmisClientProgram[] = [];

    for (const item of list.items) {
      if (item.__typename !== 'HmisEnrollmentType') {
        console.warn(
          `[useHmisClientPrograms]: invalid program for hmisClientId [${hmisClientId}]: ${item}`
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

      validPrograms.push({
        id: enrollmentId,
        name: projectName,
      });
    }

    return validPrograms;
  }, [data, hmisClientId]);

  return { programs, loading, error };
}
