// Mapa da versao web. O react-native-maps nao roda no navegador, entao este
// arquivo oferece o mesmo conjunto de pecas usado pelas telas (MapView,
// Marker, Callout) em cima do Leaflet com tiles do OpenStreetMap.

import 'leaflet/dist/leaflet.css';
import type * as Leaflet from 'leaflet';
import {
  ReactNode,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { cores } from '@/constantes/tema';

type Coordenada = {
  latitude: number;
  longitude: number;
};

type Regiao = Coordenada & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type LongPressEvent = {
  nativeEvent: {
    coordinate: Coordenada;
  };
};

export type MapViewRef = {
  animateToRegion: (regiao: Regiao, duracaoMs?: number) => void;
};

export type MarkerRef = {
  showCallout: () => void;
  hideCallout: () => void;
};

type MapViewWebProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  provider?: unknown;
  initialRegion?: Regiao;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onLongPress?: (evento: LongPressEvent) => void;
  onMapReady?: () => void;
};

type MarkerWebProps = {
  children?: ReactNode;
  coordinate: Coordenada;
  pinColor?: string;
  zIndex?: number;
};

type CalloutWebProps = {
  children?: ReactNode;
  onPress?: () => void;
};

type ContextoMapaTipo = {
  L: typeof Leaflet;
  mapa: Leaflet.Map;
};

const ContextoMapa = createContext<ContextoMapaTipo | null>(null);

const REGIAO_PADRAO: Regiao = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Converte o "delta" do react-native-maps (graus visiveis) em zoom do Leaflet.
function zoomDaRegiao(regiao: Regiao): number {
  const delta = Math.max(regiao.latitudeDelta, regiao.longitudeDelta, 0.0005);
  return Math.min(18, Math.max(2, Math.round(Math.log2(360 / delta))));
}

const MapViewWeb = forwardRef<MapViewRef, MapViewWebProps>(
  ({ style, initialRegion, onLongPress, onMapReady, children }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [contexto, setContexto] = useState<ContextoMapaTipo | null>(null);

    // Sempre a versao mais recente dos handlers, sem recriar o mapa.
    const aoSegurarRef = useRef(onLongPress);
    const aoFicarProntoRef = useRef(onMapReady);
    useEffect(() => {
      aoSegurarRef.current = onLongPress;
      aoFicarProntoRef.current = onMapReady;
    }, [onLongPress, onMapReady]);

    // A regiao inicial so vale na criacao do mapa, como no react-native-maps.
    const regiaoInicialRef = useRef(initialRegion ?? REGIAO_PADRAO);

    useEffect(() => {
      let cancelado = false;
      let mapa: Leaflet.Map | null = null;

      // Import dinamico: o Leaflet usa "window" e quebraria na pre-renderizacao.
      import('leaflet').then(modulo => {
        const L = ((modulo as { default?: typeof Leaflet }).default ?? modulo) as typeof Leaflet;
        if (cancelado || !containerRef.current) return;

        const regiao = regiaoInicialRef.current;
        // Zoom no canto inferior esquerdo: o topo e ocupado pelos filtros das telas.
        mapa = L.map(containerRef.current, { zoomControl: false }).setView(
          [regiao.latitude, regiao.longitude],
          zoomDaRegiao(regiao)
        );
        L.control.zoom({ position: 'bottomleft' }).addTo(mapa);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(mapa);

        // No navegador, "segurar" equivale ao clique direito (ou toque longo em telas touch).
        mapa.on('contextmenu', evento => {
          aoSegurarRef.current?.({
            nativeEvent: {
              coordinate: {
                latitude: evento.latlng.lat,
                longitude: evento.latlng.lng,
              },
            },
          });
        });

        setContexto({ L, mapa });
        aoFicarProntoRef.current?.();
      });

      return () => {
        cancelado = true;
        mapa?.remove();
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion(regiao, duracaoMs = 500) {
          contexto?.mapa.flyTo([regiao.latitude, regiao.longitude], zoomDaRegiao(regiao), {
            duration: duracaoMs / 1000,
          });
        },
      }),
      [contexto]
    );

    return (
      <View style={[estilos.raiz, style]}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {contexto ? (
          <ContextoMapa.Provider value={contexto}>{children}</ContextoMapa.Provider>
        ) : null}
      </View>
    );
  }
);

MapViewWeb.displayName = 'MapViewWeb';

// Pino em formato de gota, na cor pedida (equivalente ao pinColor nativo).
function criarIcone(L: typeof Leaflet, cor: string): Leaflet.DivIcon {
  return L.divIcon({
    className: '',
    html:
      `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;` +
      `background:${cor};border:2px solid ${cores.superficie};transform:rotate(-45deg);` +
      `box-shadow:0 1px 4px ${cores.veu}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 28],
    popupAnchor: [0, -26],
  });
}

export const Marker = forwardRef<MarkerRef, MarkerWebProps>(
  ({ coordinate, pinColor, zIndex, children }, ref) => {
    const contexto = useContext(ContextoMapa);
    const marcadorRef = useRef<Leaflet.Marker | null>(null);
    // showCallout pode chegar antes de o Leaflet terminar de carregar.
    const abrirAoCriarRef = useRef(false);
    // Elemento onde o conteudo do Callout e desenhado dentro do popup do Leaflet.
    const [containerPopup] = useState(() =>
      typeof document === 'undefined' ? null : document.createElement('div')
    );

    const temCallout = Boolean(children);
    const { latitude, longitude } = coordinate;

    useEffect(() => {
      if (!contexto) return;

      const marcador = contexto.L.marker([latitude, longitude], {
        icon: criarIcone(contexto.L, pinColor ?? cores.primaria),
        zIndexOffset: zIndex ?? 0,
      }).addTo(contexto.mapa);

      if (temCallout && containerPopup) {
        marcador.bindPopup(containerPopup, { minWidth: 200 });
      }
      marcadorRef.current = marcador;

      if (abrirAoCriarRef.current) {
        abrirAoCriarRef.current = false;
        marcador.openPopup();
      }

      return () => {
        marcador.remove();
        marcadorRef.current = null;
      };
    }, [contexto, latitude, longitude, pinColor, zIndex, temCallout, containerPopup]);

    useImperativeHandle(
      ref,
      () => ({
        showCallout: () => {
          if (marcadorRef.current) {
            marcadorRef.current.openPopup();
          } else {
            abrirAoCriarRef.current = true;
          }
        },
        hideCallout: () => {
          abrirAoCriarRef.current = false;
          marcadorRef.current?.closePopup();
        },
      }),
      []
    );

    if (!children || !containerPopup) return null;
    return createPortal(children, containerPopup);
  }
);

Marker.displayName = 'MarkerWeb';

export function Callout({ children, onPress }: CalloutWebProps) {
  const elementoRef = useRef<HTMLDivElement>(null);
  const aoTocarRef = useRef(onPress);
  useEffect(() => {
    aoTocarRef.current = onPress;
  }, [onPress]);

  // Listener direto no elemento: o popup do Leaflet interrompe a propagacao do
  // clique, entao o onClick do React (delegado na raiz) nunca seria chamado.
  useEffect(() => {
    const elemento = elementoRef.current;
    if (!elemento) return;

    const aoClicar = () => aoTocarRef.current?.();
    elemento.addEventListener('click', aoClicar);
    return () => elemento.removeEventListener('click', aoClicar);
  }, []);

  return (
    <div ref={elementoRef} style={{ cursor: onPress ? 'pointer' : 'default' }}>
      {children}
    </div>
  );
}

export const PROVIDER_DEFAULT = undefined;

export default MapViewWeb;

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: cores.fundo,
  },
});
