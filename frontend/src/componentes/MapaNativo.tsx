import MapView, {
  Callout,
  LongPressEvent,
  Marker,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

export { Callout, Marker, PROVIDER_DEFAULT };
export type { LongPressEvent };
export type MapViewRef = MapView;
export type MarkerRef = InstanceType<typeof Marker>;
export default MapView;
