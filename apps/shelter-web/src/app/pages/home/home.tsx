import { useMap } from '@vis.gl/react-google-maps';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHELTERS_MAP_ID } from '../../constants.app';
import { MaxWLayout } from '../../layout/maxWLayout';
import { modalAtom } from '../../shared/atoms/modalAtom';
import { sheltersAtom } from '../../shared/atoms/sheltersAtom';
import { LA_COUNTY_CENTER } from '../../shared/components/map/constants.maps';
import { Map } from '../../shared/components/map/map';
import {
  LatLngLiteral,
  TMapBounds,
  TMapState,
  TMarker,
} from '../../shared/components/map/types.maps';
import { toGoogleLatLngLiteral } from '../../shared/components/map/utils/toGoogleLatLngLiteral';
import { toTMapBounds } from '../../shared/components/map/utils/toMapBounds';
import { ShelterCard } from '../../shared/components/shelter/shelterCard';
import { ShelterSearch } from '../../shared/components/shelters/shelterSearch';

export function Home() {
  const map = useMap();
  const navigate = useNavigate();

  const [_modal, setModal] = useAtom(modalAtom);
  const [shelters] = useAtom(sheltersAtom);
  const [shelterMarkers, setShelterMarkers] = useState<TMarker[]>([]);
  const [mapBoundsFilter, setMapBoundsFilter] = useState<TMapBounds>();

  const handleMarkerClick = (shelterId: string | null | undefined) => {
    if (!shelterId) {
      return;
    }

    const shelter = shelters.find((shelter) => shelter.id === shelterId);

    if (!shelter) {
      return;
    }

    const { location } = shelter;

    const onCardClick = () => {
      sessionStorage.setItem(
        'mapCenter',
        JSON.stringify({
          lat: location?.latitude,
          lng: location?.longitude,
        })
      );

      navigate(`/shelter/${shelter.id}`);
    };

    setModal({
      content: (
        <ShelterCard className="mt-4" shelter={shelter} onClick={onCardClick} />
      ),
      closeOnMaskClick: true,
    });
  };

  useEffect(() => {
    const markers = shelters
      .filter((shelter) => !!shelter.location)
      .map((shelter) => {
        return {
          id: shelter.id,
          position: shelter.location,
          label: shelter.name,
          onClick: () => handleMarkerClick(shelter.id),
        } as TMarker;
      });

    setShelterMarkers(markers);
  }, [shelters]);

  function onSearchMapArea(bounds?: google.maps.LatLngBounds) {
    if (!bounds) {
      return;
    }

    setMapBoundsFilter(toTMapBounds(bounds));
  }

  function onIdle(state: TMapState | null) {
    console.log('*****************  onIdle:', state?.center);
  }

  function onInit(state: TMapState) {
    console.log('*****************  onInit:', state.center);

    setSavedCenter();
  }

  function onCenterInit(state: TMapState) {
    console.log('*****************  onCenterInit:', state.center);
    setMapBoundsFilter(toTMapBounds(state.bounds));
  }

  function onSearchLocationSelect(coordinates: LatLngLiteral) {
    console.log('*****************  onSearchLocationSelect:', coordinates);
    if (!map) {
      return;
    }

    map.setCenter(coordinates);

    const bounds = map.getBounds();

    if (bounds) {
      setMapBoundsFilter(toTMapBounds(bounds));
    }
  }

  function setSavedCenter() {
    if (!map) {
      return;
    }

    const savedCenter = sessionStorage.getItem('mapCenter');

    if (savedCenter && map) {
      const newCenter = JSON.parse(savedCenter);

      map.setCenter(newCenter);
    }
  }

  return (
    <>
      <MaxWLayout className="-mx-4">
        <Map
          mapId={SHELTERS_MAP_ID}
          className="h-[70vh] md:h-80"
          defaultCenter={toGoogleLatLngLiteral(LA_COUNTY_CENTER)}
          markers={shelterMarkers}
          onSearchMapArea={onSearchMapArea}
          onIdle={onIdle}
          onInit={onInit}
          onCenterInit={onCenterInit}
          enableUseUserLocation={true}
        />
      </MaxWLayout>
      <ShelterSearch
        mapBoundsFilter={mapBoundsFilter}
        onLocationSelect={onSearchLocationSelect}
      />
    </>
  );
}
