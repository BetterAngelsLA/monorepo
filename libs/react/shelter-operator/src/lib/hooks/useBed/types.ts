import { GetBedQuery } from '../../components/beds/api/__generated__/bedQueries.generated';

export type UseBedResultType = GetBedQuery['beds']['results'][number];
