import { useQuery } from '@apollo/client/react';
import {
  operatorPath,
  reservationPathSegment,
  reservationSelectShelterSegment,
} from '@monorepo/react/shelter';
import { Pencil } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BedStatusChoices,
  BedTypeChoices,
} from '../../apollo/graphql/__generated__/types';
import {
  BedTable,
  type BedRoomForList,
  type BedRowObject,
  type ReservationLayoutStyle,
} from '../../components/BedTable';
import { Button } from '../../components/base-ui/buttons';
import { GetShelterNameDocument } from '../../graphql/__generated__/shelters.generated';
import type { ReservationFormData } from './types';

const MOCK_BED_DEFAULTS = {
  maintenanceFlag: false,
  accessibility: [],
  b7: false,
  demographics: [],
  funders: [],
  pets: [],
  shelter: {} as never,
  storage: false,
  bedType: BedTypeChoices.Twin,
};

// TODO: Replace with real GraphQL query once rooms/beds query is available
const MOCK_ROOMS: BedRoomForList[] = [
  {
    id: 'room-1',
    roomLabel: 'Room 1',
    beds: [
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1a',
        bedName: '1A',
        status: BedStatusChoices.Available,
      },
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1b',
        bedName: '1B',
        status: BedStatusChoices.Available,
      },
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1c',
        bedName: '1C',
        status: BedStatusChoices.Available,
      },
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1d',
        bedName: '1D',
        status: BedStatusChoices.Available,
      },
    ],
  },
  {
    id: 'room-2',
    roomLabel: 'Room 1',
    beds: [
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1e',
        bedName: '1E',
        status: BedStatusChoices.Available,
      },
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1f',
        bedName: '1F',
        status: BedStatusChoices.Available,
      },
      {
        ...MOCK_BED_DEFAULTS,
        id: 'bed-1g',
        bedName: '1G',
        status: BedStatusChoices.Available,
      },
    ],
  },
];

const loadingState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    Loading rooms…
  </div>
);

const emptyState = (
  <div className="px-6 py-8 text-center text-sm text-gray-500">
    No rooms available for this shelter.
  </div>
);

function countBeds(rooms: BedRoomForList[]) {
  return rooms.reduce((n, r) => n + r.beds.length, 0);
}

/** Resolve shelter id when URL is `/operator/shelter/:id/reservation/...` but params/form are empty. */
function shelterIdFromOperatorPath(pathname: string): string | undefined {
  const marker = `${operatorPath}/shelter/`;
  const idx = pathname.indexOf(marker);
  if (idx === -1) return undefined;
  const tail = pathname.slice(idx + marker.length);
  const first = tail.split('/')[0];
  if (!first || first === reservationPathSegment) return undefined;
  return first;
}

function reservationResultHeading(
  layout: ReservationLayoutStyle,
  roomCount: number,
  bedCount: number
) {
  switch (layout) {
    case 'motel':
      return `${roomCount} Matching Rooms Found`;
    case 'mixed':
      return `${bedCount} Matching Rooms & Beds Found`;
    default:
      return `${bedCount} Matching Beds Found`;
  }
}

function shelterSubtitleLine(
  shelterPk: string | undefined,
  loading: boolean,
  name: string | undefined
): string {
  if (!shelterPk) {
    return 'Select a shelter to see matches';
  }
  if (loading) {
    return 'Loading shelter…';
  }
  if (name) {
    return `for ${name}`;
  }
  return 'for this shelter';
}

export function SelectRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shelterId: routeShelterId } = useParams();
  const { setValue, watch } = useFormContext<ReservationFormData>();
  const selectedBedId = watch('bedId');
  const reservationLayoutStyle = watch('reservationLayoutStyle');
  const shelterIdForm = watch('shelterId');
  const shelterPk = useMemo(() => {
    const fromRouteOrForm = (routeShelterId || shelterIdForm || '').trim();
    if (fromRouteOrForm) return fromRouteOrForm;
    return shelterIdFromOperatorPath(location.pathname);
  }, [routeShelterId, shelterIdForm, location.pathname]);

  const { data: shelterNameData, loading: shelterNameLoading } = useQuery(
    GetShelterNameDocument,
    {
      variables: { id: shelterPk ?? '' },
      skip: !shelterPk,
    }
  );

  const shelterSubtitle = useMemo(
    () =>
      shelterSubtitleLine(
        shelterPk,
        shelterNameLoading,
        shelterNameData?.shelter?.name
      ),
    [shelterPk, shelterNameLoading, shelterNameData?.shelter?.name]
  );

  const roomCount = MOCK_ROOMS.length;
  const bedCount = useMemo(() => countBeds(MOCK_ROOMS), []);
  const heading = useMemo(
    () => reservationResultHeading(reservationLayoutStyle, roomCount, bedCount),
    [reservationLayoutStyle, roomCount, bedCount]
  );

  const handleBackToShelters = () => {
    navigate(
      shelterPk
        ? `${operatorPath}/shelter/${shelterPk}`
        : `${operatorPath}/${reservationPathSegment}/${reservationSelectShelterSegment}`
    );
  };

  const handleBedClick = (rowObject: BedRowObject) => {
    const key = rowObject.bedId;
    const nextBedId = selectedBedId === key ? null : key;
    setValue('bedId', nextBedId);
    setValue('roomId', nextBedId ? rowObject.roomId : null);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1E3342]">{heading}</h2>
          <p className="mt-1 text-sm text-[#747A82]">{shelterSubtitle}</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary-sm"
            rightIcon={false}
            onClick={handleBackToShelters}
          >
            Back to Shelters
          </Button>
          <Button
            type="button"
            variant="primary-sm"
            color="blue"
            leftIcon={<Pencil size={16} stroke="white" />}
            rightIcon={false}
            onClick={() => {
              // TODO: open filters UI
            }}
          >
            Edit Filters
          </Button>
        </div>
      </div>

      <BedTable
        variant="reservation"
        reservationLayoutStyle={reservationLayoutStyle}
        rooms={MOCK_ROOMS}
        onRowClick={handleBedClick}
        selectedBedIds={selectedBedId ? [selectedBedId] : []}
        loadingState={loadingState}
        emptyState={emptyState}
      />
    </div>
  );
}
