// ============================================================
// TELA: Mapa - VERSAO COM TAP PARA CADASTRAR
// Rota: /(abas)/mapa
// ============================================================

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  MapViewRef,
  MarkerRef,
  LongPressEvent,
  Marker,
  PROVIDER_DEFAULT,
} from "@/componentes/MapaNativo";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { usePontos } from "@/hooks/usePontos";
import { CATEGORIAS } from "@/constantes/categorias";
import {
  Bordas,
  Cores,
  CoresCategorias,
  Espacamento,
  Fontes,
  Sombra,
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

  const mapaRef = useRef<MapViewRef>(null);
  const marcadoresRef = useRef<Record<number, MarkerRef | null>>({});
  const [mapaPronto, setMapaPronto] = useState(false);
  const [locUsuario, setLocUsuario] = useState<Coordenada | null>(null);

  // Marcador temporario gerado pelo toque do usuario no mapa.
  // Mantemos no state para poder limpar/exibir o pin amarelo.
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
      return Cores.primaria;
    }

    return CoresCategorias[ponto.categorias[0].id] ?? Cores.primaria;
  }

  // ----- Handler: toque longo no mapa -----
  // Recebe o evento nativo (lat/lng do ponto tocado). Mostra um
  // marcador amarelo temporario e pergunta se quer cadastrar.
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
              <View style={estilos.callout}>
                <Text style={estilos.calloutNome} numberOfLines={2}>
                  {ponto.nome}
                </Text>
                <Text style={estilos.calloutBairro}>{ponto.bairro}</Text>
                {ponto.horarioFuncionamento ? (
                  <Text style={estilos.calloutHorario}>
                    {ponto.horarioFuncionamento}
                  </Text>
                ) : null}
                <Text style={estilos.calloutVer}>Toque para ver detalhes</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcador temporario (do toque do usuario) - cor ambar destacada. */}
        {marcadorTemp ? (
          <Marker
            coordinate={marcadorTemp}
            pinColor={Cores.acento}
            zIndex={9999}
          />
        ) : null}
      </MapView>

      {/* Dica de uso flutuante (so mostra quando nao ha pin temp) */}
      {!marcadorTemp ? (
        <View style={estilos.dica}>
          <MaterialCommunityIcons
            name="gesture-tap-hold"
            size={14}
            color={Cores.primaria}
          />
          <Text style={estilos.dicaTexto}>
            Segure no mapa para cadastrar um novo ponto
          </Text>
        </View>
      ) : null}

      {/* Filtro categorias */}
      <View style={estilos.filtroContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filtroScroll}
        >
          <TouchableOpacity
            style={[estilos.chip, !categoriaSelecionada && estilos.chipAtivo]}
            onPress={() => setCategoria(undefined)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                estilos.chipTexto,
                !categoriaSelecionada && estilos.chipTextoAtivo,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {CATEGORIAS.map((cat) => {
            const ativo = categoriaSelecionada === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  estilos.chip,
                  ativo && { backgroundColor: cat.cor, borderColor: cat.cor },
                ]}
                onPress={() => setCategoria(ativo ? undefined : cat.id)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={cat.icone as any}
                  size={13}
                  color={ativo ? Cores.branco : cat.cor}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}
                >
                  {cat.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contador de pontos */}
      <View style={estilos.contador}>
        {carregando ? (
          <ActivityIndicator size="small" color={Cores.primaria} />
        ) : (
          <View style={estilos.contadorLinha}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={Cores.primaria}
            />
            <Text style={estilos.contadorTexto}>
              {pontos.length} {pontos.length === 1 ? "ponto" : "pontos"}
            </Text>
          </View>
        )}
      </View>

      {/* Botao recentrar GPS */}
      <TouchableOpacity
        style={estilos.btnRecentrar}
        onPress={recentrar}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={22}
          color={Cores.primaria}
        />
      </TouchableOpacity>

      {/* FAB novo ponto (sem coordenadas - abre form vazio) */}
      <TouchableOpacity
        style={estilos.fab}
        onPress={() => router.push("/ponto/novo")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={Cores.branco} />
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  mapa: { flex: 1 },

  // ------ Dica flutuante ------
  dica: {
    position: "absolute",
    bottom: 150,
    // Ocupa a largura livre a esquerda do botao de recentrar (44 px), para
    // os dois nao se sobreporem em telas estreitas.
    left: Espacamento.lg,
    right: Espacamento.lg + 44 + Espacamento.sm,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Cores.branco,
    paddingHorizontal: Espacamento.md,
    paddingVertical: 8,
    borderRadius: Bordas.raioTotal,
    ...Sombra.padrao,
  },
  dicaTexto: {
    flexShrink: 1,
    fontSize: Fontes.pequena,
    color: Cores.cinzaEscuro,
    fontWeight: Fontes.medio_peso,
  },

  // ------ Callout do marcador ------
  callout: {
    width: 200,
    padding: Espacamento.sm,
  },
  calloutNome: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
    marginBottom: 2,
  },
  calloutBairro: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
  },
  calloutHorario: {
    fontSize: Fontes.pequena,
    color: Cores.secundaria,
    marginTop: 2,
  },
  calloutVer: {
    fontSize: Fontes.pequena,
    color: Cores.primaria,
    fontWeight: Fontes.medio_peso,
    marginTop: Espacamento.xs,
  },

  // ------ Filtro categorias ------
  filtroContainer: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
  },
  filtroScroll: {
    paddingHorizontal: Espacamento.md,
    gap: Espacamento.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 6,
    ...Sombra.suave,
  },
  chipAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  chipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },
  chipTextoAtivo: { color: Cores.branco },

  // ------ Contador ------
  contador: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.md,
    paddingVertical: 6,
    ...Sombra.padrao,
  },
  contadorLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contadorTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.preto,
  },

  // ------ Botao recentrar ------
  btnRecentrar: {
    position: "absolute",
    bottom: 150,
    right: Espacamento.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.branco,
    alignItems: "center",
    justifyContent: "center",
    ...Sombra.padrao,
  },

  // ------ FAB ------
  fab: {
    position: "absolute",
    bottom: Espacamento.xl,
    right: Espacamento.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Cores.primaria,
    alignItems: "center",
    justifyContent: "center",
    ...Sombra.forte,
  },
});
