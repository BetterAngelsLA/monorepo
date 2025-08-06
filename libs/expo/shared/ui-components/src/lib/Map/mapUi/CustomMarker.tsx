import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import React from 'react';
import { View } from 'react-native';
import { MapMarkerProps, Marker } from 'react-native-maps';
import TextBold from '../../TextBold';

type CustomMarkerProps = MapMarkerProps & {
  label?: string;
  renderIcon: () => React.ReactNode;
};

export function CustomMarker({
  label,
  renderIcon,
  ...markerProps
}: CustomMarkerProps) {
  return (
    <Marker {...markerProps}>
      <View style={{ alignItems: 'center' }}>
        {label && (
          <View
            style={{
              paddingHorizontal: Spacings.sm,
              paddingTop: Spacings.xs,
              paddingBottom: Spacings.xxs,
            }}
          >
            <View
              style={{
                paddingHorizontal: Spacings.xs,
                backgroundColor: Colors.WHITE,
                borderRadius: Radiuses.xxxl,
                ...Shadow,
              }}
            >
              <TextBold size="sm">{label}</TextBold>
            </View>
          </View>
        )}
        {renderIcon()}
      </View>
    </Marker>
  );
}
