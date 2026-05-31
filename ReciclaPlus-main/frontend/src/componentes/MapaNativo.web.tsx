import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode, forwardRef, useImperativeHandle } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Bordas, Cores, Espacamento, Fontes } from '@/constantes/tema';

type Coordenada = {
  latitude: number;
  longitude: number;
};

export type MapPressEvent = {
  nativeEvent: {
    coordinate: Coordenada;
  };
};

export type MapViewRef = {
  animateToRegion: () => void;
};

type MapViewWebProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  provider?: unknown;
  initialRegion?: unknown;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onPress?: (evento: MapPressEvent) => void;
};

type FilhoWebProps = {
  children?: ReactNode;
  coordinate?: Coordenada;
  onPress?: () => void;
  pinColor?: string;
  zIndex?: number;
};

const MapViewWeb = forwardRef<MapViewRef, MapViewWebProps>(({ style }, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => undefined,
  }));

  return (
    <View style={[estilos.raiz, style]}>
      <View style={estilos.painel}>
        <MaterialCommunityIcons
          name="map-marker-off"
          size={34}
          color={Cores.primaria}
        />
        <Text style={estilos.titulo}>Mapa indisponivel no navegador</Text>
        <Text style={estilos.texto}>
          Abra pelo Expo Go ou use a aba Lista para ver os pontos no web.
        </Text>
      </View>
    </View>
  );
});

MapViewWeb.displayName = 'MapViewWeb';

export function Marker(_props: FilhoWebProps) {
  return null;
}

export function Callout(_props: FilhoWebProps) {
  return null;
}

export const PROVIDER_DEFAULT = undefined;

export default MapViewWeb;

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.cinzaClaro,
    padding: Espacamento.lg,
  },
  painel: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: Espacamento.sm,
    borderRadius: Bordas.raio,
    backgroundColor: Cores.branco,
    padding: Espacamento.lg,
  },
  titulo: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
    textAlign: 'center',
  },
  texto: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    lineHeight: 18,
    textAlign: 'center',
  },
});
