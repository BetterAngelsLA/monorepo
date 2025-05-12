import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BaMap, TGeoPoint } from '../../ui-components';
import { TLaLocation } from '../../ui-components/Map/locations';

type TSelectedState = {
  items?: TGeoPoint<TLaLocation>[];
  zoomLevel?: number;
};

export default function ClusterG(google?: boolean) {
  const [selectedState, setSelectedState] = useState<TSelectedState | null>(
    null
  );

  function onSelectedChange(
    items: TGeoPoint<TLaLocation>[],
    zoomLevel: number
  ) {
    setSelectedState({
      items,
      zoomLevel,
    });
  }

  return (
    <ScrollView>
      <View>
        <BaMap
          provider="google"
          onSelectedChange={onSelectedChange}
          onRegionChangeComplete={(region) => {
            console.log('onRegionChange: ', region);
          }}
        />
      </View>
      <View
        style={{
          padding: 16,
          paddingBottom: 40,
        }}
      >
        {!!selectedState?.zoomLevel && (
          <View>
            <TextRegular>Zoom level: {selectedState?.zoomLevel}</TextRegular>
          </View>
        )}

        {!!selectedState?.items?.length && (
          <View
            style={{
              marginTop: 24,
              gap: 12,
            }}
          >
            <TextRegular mb="sm">
              Selected locations: {selectedState.items.length}
            </TextRegular>

            {selectedState.items.map((item) => {
              return (
                <View
                  key={item.properties.pointId}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'baseline',
                  }}
                >
                  <TextRegular mr="sm" size="xs">
                    {item.properties.pointId}
                  </TextRegular>
                  <TextRegular>{item.properties.name}</TextRegular>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
