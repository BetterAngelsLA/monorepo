import * as Types from '../../../../../../../expo/betterangels/src/lib/apollo/graphql/__generated__/types';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ViewShelterQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type ViewShelterQuery = { __typename?: 'Query', shelter: { __typename?: 'ShelterType', bedFees?: string | null, cityCouncilDistrict?: number | null, curfew?: any | null, demographicsOther?: string | null, description: string, email?: string | null, entryInfo?: string | null, heroImage?: string | null, id: string, maxStay?: number | null, name: string, onSiteSecurity?: boolean | null, fundersOther?: string | null, otherRules?: string | null, otherServices?: string | null, overallRating?: number | null, phone: any, programFees?: string | null, roomStylesOther?: string | null, shelterProgramsOther?: string | null, shelterTypesOther?: string | null, status: Types.StatusChoices, subjectiveReview?: string | null, supervisorialDistrict?: number | null, totalBeds?: number | null, website?: string | null, accessibility: Array<{ __typename?: 'AccessibilityType', name?: Types.AccessibilityChoices | null }>, additionalContacts: Array<{ __typename?: 'ContactInfoType', contactName: string, contactNumber: any }>, cities: Array<{ __typename?: 'CityType', name?: Types.CityChoices | null }>, demographics: Array<{ __typename?: 'DemographicType', name?: Types.DemographicChoices | null }>, entryRequirements: Array<{ __typename?: 'EntryRequirementType', name?: Types.EntryRequirementChoices | null }>, exteriorPhotos: Array<{ __typename?: 'ShelterPhotoType', file: { __typename?: 'DjangoFileType', name: string, url: string } }>, generalServices: Array<{ __typename?: 'GeneralServiceType', name?: Types.GeneralServiceChoices | null }>, healthServices: Array<{ __typename?: 'HealthServiceType', name?: Types.HealthServiceChoices | null }>, immediateNeeds: Array<{ __typename?: 'ImmediateNeedType', name?: Types.ImmediateNeedChoices | null }>, interiorPhotos: Array<{ __typename?: 'ShelterPhotoType', file: { __typename?: 'DjangoFileType', name: string, url: string } }>, location: { __typename?: 'ShelterLocationType', latitude: number, longitude: number, place: string }, organization?: { __typename?: 'OrganizationType', name: string } | null, parking: Array<{ __typename?: 'ParkingType', name?: Types.ParkingChoices | null }>, pets: Array<{ __typename?: 'PetType', name?: Types.PetChoices | null }>, roomStyles: Array<{ __typename?: 'RoomStyleType', name?: Types.RoomStyleChoices | null }>, shelterPrograms: Array<{ __typename?: 'ShelterProgramType', name?: Types.ShelterProgramChoices | null }>, shelterTypes: Array<{ __typename?: 'ShelterTypeType', name?: Types.ShelterChoices | null }>, spa: Array<{ __typename?: 'SPAType', name?: Types.SpaChoices | null }>, specialSituationRestrictions: Array<{ __typename?: 'SpecialSituationRestrictionType', name?: Types.SpecialSituationRestrictionChoices | null }>, storage: Array<{ __typename?: 'StorageType', name?: Types.StorageChoices | null }>, trainingServices: Array<{ __typename?: 'TrainingServiceType', name?: Types.TrainingServiceChoices | null }> } };


export const ViewShelterDocument = gql`
    query ViewShelter($id: ID!) {
  shelter(pk: $id) {
    bedFees
    cityCouncilDistrict
    curfew
    demographicsOther
    description
    email
    entryInfo
    heroImage
    id
    maxStay
    name
    onSiteSecurity
    fundersOther
    otherRules
    otherServices
    overallRating
    phone
    programFees
    roomStylesOther
    shelterProgramsOther
    shelterTypesOther
    status
    subjectiveReview
    supervisorialDistrict
    totalBeds
    website
    accessibility {
      name
    }
    additionalContacts {
      contactName
      contactNumber
    }
    cities {
      name
    }
    demographics {
      name
    }
    entryRequirements {
      name
    }
    exteriorPhotos {
      file {
        name
        url
      }
    }
    generalServices {
      name
    }
    healthServices {
      name
    }
    immediateNeeds {
      name
    }
    interiorPhotos {
      file {
        name
        url
      }
    }
    location {
      latitude
      longitude
      place
    }
    organization {
      name
    }
    parking {
      name
    }
    pets {
      name
    }
    roomStyles {
      name
    }
    shelterPrograms {
      name
    }
    shelterTypes {
      name
    }
    spa {
      name
    }
    specialSituationRestrictions {
      name
    }
    storage {
      name
    }
    trainingServices {
      name
    }
  }
}
    `;

/**
 * __useViewShelterQuery__
 *
 * To run a query within a React component, call `useViewShelterQuery` and pass it any options that fit your needs.
 * When your component renders, `useViewShelterQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useViewShelterQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useViewShelterQuery(baseOptions: Apollo.QueryHookOptions<ViewShelterQuery, ViewShelterQueryVariables> & ({ variables: ViewShelterQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ViewShelterQuery, ViewShelterQueryVariables>(ViewShelterDocument, options);
      }
export function useViewShelterLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ViewShelterQuery, ViewShelterQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ViewShelterQuery, ViewShelterQueryVariables>(ViewShelterDocument, options);
        }
export function useViewShelterSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ViewShelterQuery, ViewShelterQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ViewShelterQuery, ViewShelterQueryVariables>(ViewShelterDocument, options);
        }
export type ViewShelterQueryHookResult = ReturnType<typeof useViewShelterQuery>;
export type ViewShelterLazyQueryHookResult = ReturnType<typeof useViewShelterLazyQuery>;
export type ViewShelterSuspenseQueryHookResult = ReturnType<typeof useViewShelterSuspenseQuery>;
export type ViewShelterQueryResult = Apollo.QueryResult<ViewShelterQuery, ViewShelterQueryVariables>;