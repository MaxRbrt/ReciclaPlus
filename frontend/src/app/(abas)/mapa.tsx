// ============================================================
// TELA: Mapa
// Rota: /(abas)/mapa
//
// Toque em um marcador abre o balao do ponto; toque longo em area vazia
// oferece o cadastro de um ponto naquele local.
// ============================================================

import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, {
  Callout,
  MapViewRef,
  MarkerRef,
  LongPressEvent,
  Marker,
  PROVIDER_DEFAULT,
} from "@/componentes/MapaNativo";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { BalaoPonto } from "@/componentes/BalaoPonto";
import { BotaoFlutuante } from "@/componentes/BotaoFlutuante";
import { BotaoIcone } from "@/componentes/BotaoIcone";
import { FiltroCategorias } from "@/componentes/FiltroCategorias";
import { Icone } from "@/componentes/Icone";
import { Texto } from "@/componentes/Texto";
import { usePontos } from "@/hooks/usePontos";
import {
  cores,
  coresCategorias,
  espaco,
  raios,
  sombras,
  tamanhos,
} from "@/constantes/tema";
import { Ponto } from "@/tipos/ponto";
import { alertar } from "@/servicos/alerta";

const REGIAO_INICIAL = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type Coordenada = {
  latitude: number;
  longitude: number;
};

export default function TelaMapa() {
  // ?pontoId=..&foco=.. : aberto a partir de outra tela (ex.: Comunidade) para
  // mostrar um ponto especifico. "foco" muda a cada pedido, para que tocar de
  // novo no mesmo ponto volte a centralizar.
  const params = useLocalSearchParams<{ pontoId?: string; foco?: string }>();
  const chaveFoco = params.pontoId ? `${params.pontoId}:${params.foco ?? ""}` : null;
  const margens = useSafeAreaInsets();

  const mapaRef = useRef<MapViewRef>(null);
  const marcadoresRef = useRef<Record<number, MarkerRef | null>>({});
  const [mapaPronto, setMapaPronto] = useState(false);
  const [locUsuario, setLocUsuario] = useState<Coordenada | null>(null);

  // Marcador temporario gerado pelo toque longo do usuario no mapa.
  // Mantemos no state para poder limpar/exibir o pin escuro.
  const [marcadorTemp, setMarcadorTemp] = useState<Coordenada | null>(null);

  const [categoriaSelecionada, setCategoria] = useState<number | undefined>(
    undefined,
  );

  // Novo pedido de foco: tira o filtro de categoria, senao o ponto pedido
  // poderia estar escondido.
  const [chaveFocoVista, setChaveFocoVista] = useState<string | null>(null);
  if (chaveFoco !== chaveFocoVista) {
    setChaveFocoVista(chaveFoco);
    if (chaveFoco) setCategoria(undefined);
  }

  const { pontos, carregando } = usePontos(categoriaSelecionada);

  // Solicita permissao e guarda a localizacao do usuario.
  useEffect(() => {
    async function obterLocalizacao() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocUsuario({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    }

    obterLocalizacao();
  }, []);

  // Centraliza no usuario uma unica vez, e so se a tela nao foi aberta para
  // mostrar um ponto especifico.
  const centralizouRef = useRef(false);
  useEffect(() => {
    if (!mapaPronto || !locUsuario || centralizouRef.current || chaveFoco) {
      return;
    }

    centralizouRef.current = true;
    mapaRef.current?.animateToRegion(
      { ...locUsuario, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      800,
    );
  }, [mapaPronto, locUsuario, chaveFoco]);

  // Atende o pedido de foco quando o mapa e os pontos estiverem prontos:
  // centraliza no ponto e abre o balao dele.
  const focoAtendidoRef = useRef<string | null>(null);
  const timerFocoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mapaPronto || !chaveFoco || focoAtendidoRef.current === chaveFoco) {
      return;
    }

    const alvo = pontos.find((ponto) => ponto.id === Number(params.pontoId));
    if (!alvo) {
      return;
    }

    focoAtendidoRef.current = chaveFoco;
    centralizouRef.current = true;
    mapaRef.current?.animateToRegion(
      {
        latitude: alvo.latitude,
        longitude: alvo.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600,
    );

    // O balao abre depois da animacao; o timer sobrevive a recargas da lista.
    if (timerFocoRef.current) clearTimeout(timerFocoRef.current);
    timerFocoRef.current = setTimeout(() => {
      marcadoresRef.current[alvo.id]?.showCallout();
    }, 800);
  }, [mapaPronto, chaveFoco, params.pontoId, pontos]);

  useEffect(() => {
    return () => {
      if (timerFocoRef.current) clearTimeout(timerFocoRef.current);
    };
  }, []);

  function recentrar() {
    if (!locUsuario) {
      return;
    }

    mapaRef.current?.animateToRegion(
      { ...locUsuario, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      600,
    );
  }

  // Cor do pin de cada ponto. Usa a primeira categoria do ponto
  // como referencia. Se nao tem categoria, verde primario.
  function corMarcador(ponto: Ponto): string {
    if (!ponto.categorias?.length) {
      return cores.primaria;
    }

    return coresCategorias[ponto.categorias[0].id] ?? cores.primaria;
  }

  // ----- Handler: toque longo no mapa -----
  // Recebe o evento nativo (lat/lng do ponto tocado). Mostra um
  // marcador escuro temporario e pergunta se quer cadastrar.
  // Toque simples fica reservado para marcadores e callouts.
  function aoSegurarMapa(evento: LongPressEvent) {
    const { latitude, longitude } = evento.nativeEvent.coordinate;
    setMarcadorTemp({ latitude, longitude });

    alertar(
      "Novo ponto de coleta",
      `Cadastrar ponto nesta localização?\n\nLat: ${latitude.toFixed(
        5,
      )}\nLng: ${longitude.toFixed(5)}`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          // Limpa o marcador temporario se o usuario cancelar.
          onPress: () => setMarcadorTemp(null),
        },
        {
          text: "Cadastrar",
          onPress: () => {
            // Navega para a tela de cadastro passando as coordenadas
            // via query string. A tela /ponto/novo le com
            // useLocalSearchParams() e pre-preenche os campos.
            router.push({
              pathname: "/ponto/novo",
              params: {
                lat: String(latitude),
                lng: String(longitude),
              },
            });

            // Limpa o marcador depois de navegar.
            setMarcadorTemp(null);
          },
        },
      ],
    );
  }

  return (
    <View style={estilos.raiz}>
      {/* Mapa */}
      <MapView
        ref={mapaRef}
        style={estilos.mapa}
        provider={PROVIDER_DEFAULT}
        initialRegion={REGIAO_INICIAL}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={aoSegurarMapa}
        onMapReady={() => setMapaPronto(true)}
      >
        {/* Marcadores dos pontos cadastrados */}
        {pontos.map((ponto) => (
          <Marker
            key={ponto.id}
            ref={(marcador) => {
              marcadoresRef.current[ponto.id] = marcador;
            }}
            coordinate={{
              latitude: ponto.latitude,
              longitude: ponto.longitude,
            }}
            pinColor={corMarcador(ponto)}
          >
            <Callout onPress={() => router.push(`/ponto/${ponto.id}`)}>
              <BalaoPonto
                nome={ponto.nome}
                linha={ponto.bairro}
                horario={ponto.horarioFuncionamento}
              />
            </Callout>
          </Marker>
        ))}

        {/* Marcador temporario (do toque longo) - cor escura destacada. */}
        {marcadorTemp ? (
          <Marker
            coordinate={marcadorTemp}
            pinColor={cores.floresta}
            zIndex={9999}
          />
        ) : null}
      </MapView>

      {/* Filtro categorias */}
      <FiltroCategorias
        selecionada={categoriaSelecionada}
        aoSelecionar={setCategoria}
        style={[estilos.filtro, { top: margens.top + espaco.sm }]}
      />

      {/* Dica de uso (so mostra quando nao ha pin temp) e botao recentrar GPS */}
      <View style={estilos.faixa} pointerEvents="box-none">
        {!marcadorTemp ? (
          <View style={[estilos.pilula, estilos.dica]}>
            <Icone
              nome="gesture-tap-hold"
              tamanho={tamanhos.iconeMenor}
              cor={cores.primaria}
            />
            <Texto variante="detalhe" style={estilos.dicaTexto}>
              Segure no mapa para cadastrar um novo ponto
            </Texto>
          </View>
        ) : (
          <View style={estilos.dica} />
        )}
        <BotaoIcone
          icone="crosshairs-gps"
          rotulo="Centralizar na minha localização"
          cor={cores.primaria}
          onPress={recentrar}
        />
      </View>

      {/* Contador de pontos */}
      <View
        style={[
          estilos.pilula,
          estilos.contador,
          { top: margens.top + espaco.sm + tamanhos.chip + espaco.sm },
        ]}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={cores.primaria} />
        ) : (
          <>
            <Icone
              nome="map-marker"
              tamanho={tamanhos.iconeMenor}
              cor={cores.primaria}
            />
            <Texto variante="corpoForte">
              {pontos.length} {pontos.length === 1 ? "ponto" : "pontos"}
            </Texto>
          </>
        )}
      </View>

      {/* Novo ponto (sem coordenadas - abre form vazio) */}
      <BotaoFlutuante
        rotulo="Novo ponto"
        onPress={() => router.push("/ponto/novo")}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  mapa: { flex: 1 },

  filtro: {
    position: "absolute",
    left: 0,
    right: 0,
  },

  // Pilula branca flutuante sobre o mapa.
  pilula: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.xs,
    minHeight: tamanhos.toque,
    paddingHorizontal: espaco.md,
    borderRadius: raios.total,
    backgroundColor: cores.superficie,
    ...sombras.alta,
  },

  // Linha acima do botao flutuante: dica a esquerda, recentrar a direita.
  faixa: {
    position: "absolute",
    left: espaco.xl,
    right: espaco.xl,
    bottom: espaco.xl + tamanhos.botao + espaco.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.xs,
  },
  dica: {
    flex: 1,
  },
  dicaTexto: {
    flexShrink: 1,
  },

  // Logo abaixo da faixa de filtros.
  contador: {
    position: "absolute",
    left: espaco.xl,
  },
});
