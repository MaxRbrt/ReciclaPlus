// Perfil de uma pessoa da comunidade.
// Mostra o nome, o total de pontos e um mapa so com os pontos que ela cadastrou.

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import MapView, {
  Callout,
  MapViewRef,
  Marker,
  MarkerRef,
  PROVIDER_DEFAULT,
} from '@/componentes/MapaNativo';
import { buscarPerfil } from '@/servicos/comunidade';
import {
  Bordas,
  Cores,
  CoresCategorias,
  Espacamento,
  Fontes,
  Sombra,
} from '@/constantes/tema';
import { PerfilPessoa } from '@/tipos/comunidade';
import { Ponto } from '@/tipos/ponto';

// Regiao que enquadra todos os pontos, com folga nas bordas.
function regiaoDosPontos(pontos: Ponto[]) {
  const latitudes = pontos.map(ponto => ponto.latitude);
  const longitudes = pontos.map(ponto => ponto.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

function mesEAno(dataIso: string): string {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '';
  return `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

export default function TelaPerfilPessoa() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const mapaRef = useRef<MapViewRef>(null);
  const marcadoresRef = useRef<Record<number, MarkerRef | null>>({});

  const [perfil, setPerfil] = useState<PerfilPessoa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Incrementado pelo botao "Tentar novamente" para refazer a busca.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const dados = await buscarPerfil(Number(id));
        if (ativo) setPerfil(dados);
      } catch {
        if (ativo) setErro('Não foi possível carregar este perfil.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setErro(null);
    setTentativa(atual => atual + 1);
  }

  // Leva o mapa do perfil ate o ponto e abre o balao dele.
  function mostrarNoMapa(ponto: Ponto) {
    mapaRef.current?.animateToRegion(
      {
        latitude: ponto.latitude,
        longitude: ponto.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
    marcadoresRef.current[ponto.id]?.showCallout();
  }

  if (carregando) {
    return (
      <View style={estilos.estado}>
        <ActivityIndicator size="large" color={Cores.primaria} />
        <Text style={estilos.estadoTexto}>Carregando perfil...</Text>
      </View>
    );
  }

  if (erro || !perfil) {
    return (
      <View style={estilos.estado}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color={Cores.erro}
        />
        <Text style={estilos.estadoTitulo}>Ops!</Text>
        <Text style={estilos.estadoTexto}>{erro ?? 'Perfil não encontrado.'}</Text>
        <View style={estilos.estadoBotoes}>
          <TouchableOpacity style={estilos.btnSecundario} onPress={() => router.back()}>
            <Text style={estilos.btnSecundarioTexto}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnPrimario} onPress={tentarNovamente}>
            <MaterialCommunityIcons name="refresh" size={18} color={Cores.branco} />
            <Text style={estilos.btnPrimarioTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const membroDesde = mesEAno(perfil.criadoEm);
  const temPontos = perfil.pontos.length > 0;

  return (
    <View style={estilos.raiz}>
      <View style={estilos.header}>
        <TouchableOpacity
          style={estilos.voltarBtn}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Cores.branco} />
        </TouchableOpacity>

        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>
            {perfil.nome.trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={estilos.headerInfo}>
          <Text style={estilos.headerNome} numberOfLines={1}>
            {perfil.nome}
          </Text>
          <Text style={estilos.headerSub}>
            {perfil.totalPontos}{' '}
            {perfil.totalPontos === 1 ? 'ponto cadastrado' : 'pontos cadastrados'}
          </Text>
          {membroDesde ? (
            <Text style={estilos.headerSub}>Na comunidade desde {membroDesde}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
      >
        {temPontos ? (
          <>
            <Text style={estilos.secaoTitulo}>Mapa de {perfil.nome}</Text>
            <View style={estilos.mapaCaixa}>
              <MapView
                ref={mapaRef}
                style={estilos.mapa}
                provider={PROVIDER_DEFAULT}
                initialRegion={regiaoDosPontos(perfil.pontos)}
              >
                {perfil.pontos.map(ponto => (
                  <Marker
                    key={ponto.id}
                    ref={marcador => {
                      marcadoresRef.current[ponto.id] = marcador;
                    }}
                    coordinate={{
                      latitude: ponto.latitude,
                      longitude: ponto.longitude,
                    }}
                    pinColor={
                      CoresCategorias[ponto.categorias?.[0]?.id] ?? Cores.primaria
                    }
                  >
                    <Callout onPress={() => router.push(`/ponto/${ponto.id}`)}>
                      <View style={estilos.callout}>
                        <Text style={estilos.calloutNome} numberOfLines={2}>
                          {ponto.nome}
                        </Text>
                        <Text style={estilos.calloutLinha}>
                          {[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')}
                        </Text>
                        <Text style={estilos.calloutVer}>Toque para ver detalhes</Text>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            </View>

            <Text style={estilos.secaoTitulo}>Pontos cadastrados</Text>
            <Text style={estilos.secaoDica}>
              Toque em um ponto para vê-lo no mapa acima.
            </Text>

            {perfil.pontos.map(ponto => (
              <View key={ponto.id} style={estilos.card}>
                <TouchableOpacity
                  style={estilos.cardPrincipal}
                  onPress={() => mostrarNoMapa(ponto)}
                  activeOpacity={0.85}
                >
                  <View style={estilos.cardIcone}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={22}
                      color={Cores.primaria}
                    />
                  </View>
                  <View style={estilos.cardInfo}>
                    <Text style={estilos.cardTitulo} numberOfLines={1}>
                      {ponto.nome}
                    </Text>
                    <Text style={estilos.cardLinha} numberOfLines={1}>
                      {[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')}
                    </Text>
                    {ponto.categorias?.length > 0 ? (
                      <Text style={estilos.cardCategorias} numberOfLines={1}>
                        {ponto.categorias.map(categoria => categoria.nome).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={estilos.cardDetalhes}
                  onPress={() => router.push(`/ponto/${ponto.id}`)}
                  accessibilityLabel={`Ver detalhes de ${ponto.nome}`}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={22}
                    color={Cores.cinzaMedio}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <View style={estilos.vazio}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={48}
              color={Cores.cinzaMedio}
            />
            <Text style={estilos.estadoTitulo}>Nenhum ponto ativo</Text>
            <Text style={estilos.estadoTexto}>
              {perfil.nome} ainda não tem pontos de coleta ativos.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

  header: {
    backgroundColor: Cores.primaria,
    paddingTop: 56,
    paddingBottom: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
  },
  voltarBtn: { padding: Espacamento.xs },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.primaria,
  },
  headerInfo: { flex: 1 },
  headerNome: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.branco,
  },
  headerSub: {
    fontSize: Fontes.pequena,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  scroll: { padding: Espacamento.lg, paddingBottom: Espacamento.xl },
  secaoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginBottom: Espacamento.sm,
  },
  secaoDica: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: -Espacamento.xs,
    marginBottom: Espacamento.sm,
  },

  mapaCaixa: {
    height: 280,
    borderRadius: Bordas.raioGrande,
    overflow: 'hidden',
    marginBottom: Espacamento.lg,
    backgroundColor: Cores.branco,
    ...Sombra.suave,
  },
  mapa: { flex: 1 },
  callout: { width: 200, padding: Espacamento.sm },
  calloutNome: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
    marginBottom: 2,
  },
  calloutLinha: { fontSize: Fontes.pequena, color: Cores.cinzaMedio },
  calloutVer: {
    fontSize: Fontes.pequena,
    color: Cores.primaria,
    fontWeight: Fontes.medio_peso,
    marginTop: Espacamento.xs,
  },

  card: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Espacamento.sm,
    ...Sombra.suave,
  },
  cardPrincipal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Espacamento.md,
  },
  cardIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Cores.primariaFundo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Espacamento.sm,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitulo: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
  },
  cardLinha: { fontSize: Fontes.pequena, color: Cores.cinzaEscuro },
  cardCategorias: {
    fontSize: Fontes.pequena,
    color: Cores.secundaria,
    fontWeight: Fontes.medio_peso,
  },
  cardDetalhes: { padding: Espacamento.md },

  vazio: {
    alignItems: 'center',
    gap: Espacamento.sm,
    paddingVertical: Espacamento.xxl,
  },
  estado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    padding: Espacamento.lg,
    backgroundColor: Cores.cinzaClaro,
  },
  estadoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.cinzaEscuro,
  },
  estadoTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    textAlign: 'center',
  },
  estadoBotoes: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    marginTop: Espacamento.md,
  },
  btnSecundario: {
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raioTotal,
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
  },
  btnSecundarioTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.cinzaEscuro,
  },
  btnPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raioTotal,
    backgroundColor: Cores.primaria,
  },
  btnPrimarioTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.branco,
  },
});
