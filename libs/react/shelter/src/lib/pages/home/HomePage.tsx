import { useLocationPermission } from '@monorepo/react/components';
import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ShelterChoices } from '../../apollo';
import { sheltersAtom } from '../../atoms';
import {
  LoginBanner,
  Map,
  ModalAnimationEnum,
  ShelterCard,
  ShelterSearch,
  TMarker,
  TShelter,
  modalAtom,
} from '../../components';
import { SHELTERS_MAP_ID } from '../../constants';
import { MaxWLayout } from '../../layout';
import { useUser } from '../../providers';
import { useShelterMapSearch } from './useShelterMapSearch';

const FOOTER_STYLE = [
  'font-semibold',
  'text-sm',
  'text-center',
  'cursor-pointer',
  'text-primary-60',
  'active:text-primary-dark',
];

export function HomePage() {
  const { user } = useUser();
  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const hasLocationPermission = useLocationPermission();
  const {
    camera,
    onCameraChange,
    onMapIdle,
    showSearchButton,
    userLocation,
    onCenterSelect,
    onSearchMapArea,
    placeViewportToFit,
    onPlaceViewportFitted,
    mapBoundsFilter,
    nameSearchPinFitRequestId,
    onShelterPinsReadyForMapFit,
    onNameSearch,
    setSearchLocation,
  } = useShelterMapSearch();

  const handleClick = useCallback(
    (markerId: string | null | undefined) => {
      if (!markerId) {
        return;
      }
      setModal({
        content: (
          <ShelterCard
            className="mt-4"
            shelter={
              shelters.find((shelter) => shelter.id === markerId) as TShelter
            }
            footer={<div className={mergeCss(FOOTER_STYLE)}>View Details</div>}
          />
        ),
        animation: ModalAnimationEnum.EXPAND,
        closeOnMaskClick: true,
      });
    },
    [setModal, shelters],
  );

  useEffect(() => {
    const markers = shelters
      .filter((shelter) => !!shelter.location)
      .map((shelter) => {
        return {
          id: shelter.id,
          position: shelter.location,
          label: shelter.name,
          onClick: () => handleClick(shelter.id),
          type: shelter.shelterTypes?.find(
            (t) => t.name === ShelterChoices.AccessCenter,
          )
            ? 'purple'
            : 'secondary',
          isPrivate: shelter.isPrivate,
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [handleClick, shelters]);

  return (
    <>
      <MaxWLayout className="-mx-4 relative">
        {!user && <LoginBanner />}
        <Map
          center={camera.center}
          zoom={camera.zoom}
          onCameraChange={onCameraChange}
          onMapIdle={onMapIdle}
          className="h-[70vh] md:h-80"
          mapId={SHELTERS_MAP_ID}
          markers={shelterMarkers}
          userLocation={userLocation}
          showCurrentLocationBtn={hasLocationPermission}
          showSearchButton={showSearchButton}
          onCenterSelect={onCenterSelect}
          onSearchMapArea={onSearchMapArea}
          placeViewportToFit={placeViewportToFit}
          onPlaceViewportFitted={onPlaceViewportFitted}
        />
      </MaxWLayout>
      <ShelterSearch
        mapBoundsFilter={mapBoundsFilter}
        nameSearchPinFitRequestId={nameSearchPinFitRequestId}
        onShelterPinsReadyForMapFit={onShelterPinsReadyForMapFit}
        onNameSearch={onNameSearch}
        setLocation={setSearchLocation}
      />
      <Outlet />
    </>
  );
}
