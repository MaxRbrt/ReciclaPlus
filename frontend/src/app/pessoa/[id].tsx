// Perfil de uma pessoa da comunidade.
// Mostra o nome, o total de pontos e um mapa so com os pontos que ela cadastrou.

import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/componentes/Avatar';
import { BalaoPonto } from '@/componentes/BalaoPonto';
import { BotaoIcone } from '@/componentes/BotaoIcone';
import { CabecalhoTela } from '@/componentes/CabecalhoTela';
import { CartaoPonto } from '@/componentes/CartaoPonto';
import { EstadoTela } from '@/componentes/EstadoTela';
import MapView, {
  Callout,
  MapViewRef,
  Marker,
  MarkerRef,
  PROVIDER_DEFAULT,
} from '@/componentes/MapaNativo';
import { Secao } from '@/componentes/Secao';
import { Texto } from '@/componentes/Texto';
import { cores, coresCategorias, espaco, raios, sombras } from '@/constantes/tema';
import { buscarPerfil } from '@/servicos/comunidade';
import { PerfilPessoa } from '@/tipos/comunidade';
import { Ponto } from '@/tipos/ponto';

// Altura do mapa com os pontos da pessoa.
const ALTURA_MAPA = 280;

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
      <View style={estilos.raiz}>
        <EstadoTela preencher carregando mensagem="Carregando perfil..." />
      </View>
    );
  }

  if (erro || !perfil) {
    return (
      <View style={estilos.raiz}>
        <EstadoTela
          preencher
          icone="alert-circle-outline"
          titulo="Ops!"
          mensagem={erro ?? 'Perfil não encontrado.'}
          acaoSecundaria={{ rotulo: 'Voltar', onPress: () => router.back() }}
          acao={{ rotulo: 'Tentar novamente', icone: 'refresh', onPress: tentarNovamente }}
        />
      </View>
    );
  }

  const membroDesde = mesEAno(perfil.criadoEm);
  const temPontos = perfil.pontos.length > 0;
  const resumo = [
    `${perfil.totalPontos} ${
      perfil.totalPontos === 1 ? 'ponto cadastrado' : 'pontos cadastrados'
    }`,
    membroDesde ? `Na comunidade desde ${membroDesde}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={estilos.raiz}>
      <CabecalhoTela
        titulo={perfil.nome}
        subtitulo={resumo}
        aoVoltar={() => router.back()}
        antes={<Avatar nome={perfil.nome} />}
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {temPontos ? (
          <>
            <Secao titulo={`Mapa de ${perfil.nome}`}>
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
                        coresCategorias[ponto.categorias?.[0]?.id] ?? cores.primaria
                      }
                    >
                      <Callout onPress={() => router.push(`/ponto/${ponto.id}`)}>
                        <BalaoPonto
                          nome={ponto.nome}
                          linha={[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')}
                        />
                      </Callout>
                    </Marker>
                  ))}
                </MapView>
              </View>
            </Secao>

            <Secao titulo="Pontos cadastrados">
              <Texto variante="detalhe" cor={cores.tintaSuave}>
                Toque em um ponto para vê-lo no mapa acima.
              </Texto>

              {perfil.pontos.map(ponto => (
                <CartaoPonto
                  key={ponto.id}
                  nome={ponto.nome}
                  fotoUrl={ponto.fotoUrl}
                  linhas={[[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')]}
                  destaque={ponto.categorias
                    ?.map(categoria => categoria.nome)
                    .join(', ')}
                  onPress={() => mostrarNoMapa(ponto)}
                  acao={
                    <BotaoIcone
                      icone="information-outline"
                      rotulo={`Ver detalhes de ${ponto.nome}`}
                      variante="simples"
                      onPress={() => router.push(`/ponto/${ponto.id}`)}
                    />
                  }
                />
              ))}
            </Secao>
          </>
        ) : (
          <EstadoTela
            icone="map-marker-off"
            titulo="Nenhum ponto ativo"
            mensagem={`${perfil.nome} ainda não tem pontos de coleta ativos.`}
          />
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  conteudo: {
    gap: espaco.xl,
    paddingVertical: espaco.xl,
  },
  mapaCaixa: {
    height: ALTURA_MAPA,
    borderRadius: raios.lg,
    overflow: 'hidden',
    backgroundColor: cores.superficie,
    ...sombras.baixa,
  },
  mapa: { flex: 1 },
});
