import { Region } from 'react-native-maps';

export function regionToZoom(region: Region) {
  return Math.round(Math.log2(360 / region.longitudeDelta));
}

// const getZoomFromRegion = (region: Region) => {
//   return Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)
// }

// const getRegionForZoom = (lat: number, lon: number, zoom: number) => {
//   const distanceDelta = Math.exp(Math.log(360) - zoom * Math.LN2)
//   const { width, height } = Dimensions.get('window')
//   const aspectRatio = width / height
//   return {
//     latitude: lat,
//     longitude: lon,
//     latitudeDelta: distanceDelta * aspectRatio,
//     longitudeDelta: distanceDelta,
//   }
// }

// mapRef.current.fitToCoordinates(coordinates, {
//   edgePadding: restProps.edgePadding,
// });

// https://github.com/tomekvenits/react-native-map-clustering/blob/master/lib/ClusteredMapView.js
// https://github.com/tomekvenits/react-native-map-clustering/blob/master/lib/helpers.js
// https://github.com/tomekvenits/react-native-map-clustering/blob/master/lib/ClusteredMarker.js

// https://upsilon-it.medium.com/how-to-do-map-clustering-with-react-native-f4c5cdcfdca3
// https://github.com/mapbox/geo-viewport/blob/master/index.js
