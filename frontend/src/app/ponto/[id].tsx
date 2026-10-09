// Tela de detalhes do ponto.
// Exibe foto, dados, favoritos e acoes de gerenciamento.

import { Image, Linking, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Botao } from '@/componentes/Botao';
import { BotaoIcone } from '@/componentes/BotaoIcone';
import { EstadoTela } from '@/componentes/EstadoTela';
import { EtiquetaCategoria } from '@/componentes/EtiquetaCategoria';
import { FundoOrganico } from '@/componentes/FundoOrganico';
import { Icone, NomeIcone } from '@/componentes/Icone';
import { Pressionavel } from '@/componentes/Pressionavel';
import { Secao } from '@/componentes/Secao';
import { Texto } from '@/componentes/Texto';
import { FORMAS_DESTAQUE } from '@/constantes/formas';
import { cores, espaco, raios, sombras, tamanhos } from '@/constantes/tema';
import { buscarPonto, removerPonto } from '@/servicos/pontos';
import { mensagemErroApi } from '@/servicos/api';
import { montarUrlFoto } from '@/servicos/fotoPonto';
import {
  adicionarFavorito,
  removerFavorito,
  removerFavoritoPorPonto,
  verificarFavorito,
} from '@/servicos/favoritos';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { useLocalizacaoUsuario } from '@/hooks/useLocalizacaoUsuario';
import { distanciaKm, formatarDistancia } from '@/servicos/localizacao';
import { Ponto } from '@/tipos/ponto';
import { alertar } from '@/servicos/alerta';

// Altura da foto (ou do fundo de folhas) no topo da tela.
const ALTURA_FOTO = 280;

// Linha do bloco "Informacoes": icone, rotulo e valor.
function Informacao({
  icone,
  rotulo,
  valor,
  complemento,
}: {
  icone: NomeIcone;
  rotulo: string;
  valor: string;
  complemento?: string;
}) {
  return (
    <View style={estilos.info}>
      <Icone nome={icone} cor={cores.primaria} />
      <View style={estilos.infoTextos}>
        <Texto variante="rotulo" cor={cores.tintaSuave}>
          {rotulo}
        </Texto>
        <Texto>{valor}</Texto>
        {complemento ? (
          <Texto variante="detalhe" cor={cores.tintaSuave}>
            {complemento}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

export default function TelaDetalhesPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();
  const { posicao } = useLocalizacaoUsuario();
  const margens = useSafeAreaInsets();

  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [favoritoId, setFavoritoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  // Foto que nao abriu (ex.: cadastro antigo, salva so no aparelho de quem
  // cadastrou): mostra o "Sem foto" em vez de uma imagem quebrada.
  const [fotoComErro, setFotoComErro] = useState<string | null>(null);

  // Incrementado pelo botao "Tentar novamente" para refazer a busca.
  const [tentativa, setTentativa] = useState(0);

  // Em caso de erro, mostra uma tela recuperavel em vez de voltar sozinho.
  useEffect(() => {
    let ativo = true;

    async function buscarDados() {
      try {
        const dados = await buscarPonto(Number(id));
        if (!ativo) return;
        setPonto(dados);

        if (usuario) {
          const status = await verificarFavorito(Number(id));
          if (!ativo) return;
          setFavorito(status.favorito);
          setFavoritoId(status.favoritoId);
        }
      } catch {
        if (ativo) {
          setErro('Não foi possível carregar os dados deste ponto.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    buscarDados();

    return () => {
      ativo = false;
    };
  }, [id, usuario, tentativa]);

  function carregar() {
    setCarregando(true);
    setErro(null);
    setTentativa(atual => atual + 1);
  }

  async function aoToggleFavorito() {
    if (!ponto) return;
    setSalvando(true);
    try {
      if (favorito) {
        if (favoritoId) {
          await removerFavorito(favoritoId);
        } else {
          await removerFavoritoPorPonto(ponto.id);
        }
        setFavorito(false);
        setFavoritoId(null);
      } else {
        const novoFavorito = await adicionarFavorito(ponto.id);
        setFavorito(true);
        setFavoritoId(novoFavorito.id);
      }
    } catch {
      alertar('Erro', 'Não foi possível atualizar o favorito.');
    } finally {
      setSalvando(false);
    }
  }

  function aoEditarPonto() {
    if (!ponto) return;
    router.push(`/ponto/editar/${ponto.id}`);
  }

  // Abre o app de mapas do aparelho ja com o trajeto ate o ponto.
  function aoAbrirRota() {
    if (!ponto) return;

    const destino = `${ponto.latitude},${ponto.longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destino}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${destino}`;

    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener');
      return;
    }
    Linking.openURL(url).catch(() =>
      alertar('Erro', 'Não foi possível abrir o aplicativo de mapas.')
    );
  }

  // Envia nome, endereco, horario e link do mapa por qualquer app do aparelho.
  async function aoCompartilhar() {
    if (!ponto) return;

    const mensagem = [
      `${ponto.nome} — ponto de coleta no Recicla+`,
      [ponto.endereco, ponto.bairro, ponto.cidade].filter(Boolean).join(', '),
      ponto.horarioFuncionamento ? `Horário: ${ponto.horarioFuncionamento}` : null,
      ponto.categorias?.length
        ? `Aceita: ${ponto.categorias.map(categoria => categoria.nome).join(', ')}`
        : null,
      `https://www.google.com/maps/search/?api=1&query=${ponto.latitude},${ponto.longitude}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      // Navegador sem compartilhamento nativo: copia o texto.
      if (Platform.OS === 'web' && typeof navigator.share !== 'function') {
        await navigator.clipboard.writeText(mensagem);
        alertar('Copiado', 'As informações do ponto foram copiadas. Cole onde quiser compartilhar.');
        return;
      }
      await Share.share({ message: mensagem });
    } catch {
      // Usuario fechou a janela de compartilhamento: nada a fazer.
    }
  }

  // Acao destrutiva: confirma antes de chamar DELETE /pontos/:id.
  function aoConfirmarExcluir() {
    if (!ponto) return;

    alertar(
      'Excluir ponto',
      `Tem certeza que deseja excluir "${ponto.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setExcluindo(true);
            try {
              await removerPonto(ponto.id);
              alertar('Ponto excluído', 'O ponto foi removido com sucesso.', [
                { text: 'OK', onPress: () => router.replace('/(abas)/lista') },
              ]);
            } catch (erro) {
              alertar(
                'Erro',
                mensagemErroApi(erro, 'Não foi possível excluir o ponto. Tente novamente.')
              );
            } finally {
              setExcluindo(false);
            }
          },
        },
      ]
    );
  }

  if (carregando) {
    return (
      <View style={estilos.raiz}>
        <EstadoTela preencher carregando mensagem="Carregando ponto..." />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={estilos.raiz}>
        <EstadoTela
          preencher
          icone="alert-circle-outline"
          titulo="Ops!"
          mensagem={erro}
          acaoSecundaria={{ rotulo: 'Voltar', onPress: () => router.back() }}
          acao={{ rotulo: 'Tentar novamente', icone: 'refresh', onPress: carregar }}
        />
      </View>
    );
  }

  if (!ponto) return null;

  const fotoUri = montarUrlFoto(ponto.fotoUrl);
  const ehDono = usuario?.id === ponto.usuarioId;
  const ativo = ponto.status === 'Ativo';

  return (
    <View style={estilos.raiz}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={estilos.foto}>
          {fotoUri && fotoUri !== fotoComErro ? (
            <Image
              source={{ uri: fotoUri }}
              onError={() => setFotoComErro(fotoUri)}
              style={estilos.fotoImagem}
              resizeMode="cover"
            />
          ) : (
            <>
              <FundoOrganico formas={FORMAS_DESTAQUE} />
              <View style={estilos.semFoto}>
                <Icone
                  nome="recycle"
                  tamanho={tamanhos.botao + espaco.md}
                  cor={cores.sobreEscuroSuave}
                />
                <Texto variante="corpoForte" cor={cores.sobreEscuroSuave}>
                  Sem foto
                </Texto>
              </View>
            </>
          )}

          <View style={[estilos.fotoAcoes, { top: margens.top + espaco.sm }]}>
            <BotaoIcone icone="arrow-left" rotulo="Voltar" onPress={() => router.back()} />
            <BotaoIcone
              icone={favorito ? 'heart' : 'heart-outline'}
              rotulo={favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              cor={favorito ? cores.coracao : cores.tinta}
              carregando={salvando}
              onPress={aoToggleFavorito}
            />
          </View>
        </View>

        <View style={estilos.folha}>
          <View style={estilos.titulo}>
            <View
              style={[
                estilos.status,
                { backgroundColor: ativo ? cores.nevoa : cores.borda },
              ]}
            >
              <View
                style={[
                  estilos.statusPonto,
                  { backgroundColor: ativo ? cores.floresta : cores.tintaSuave },
                ]}
              />
              <Texto variante="rotulo" cor={ativo ? cores.floresta : cores.tintaSuave}>
                {ponto.status}
              </Texto>
            </View>

            <Texto variante="display">{ponto.nome}</Texto>
            <View style={estilos.linha}>
              <Icone
                nome="map-marker"
                tamanho={tamanhos.iconeMenor}
                cor={cores.tintaSuave}
              />
              <Texto cor={cores.tintaSuave} style={estilos.flexivel}>
                {[
                  ponto.bairro,
                  posicao
                    ? `a ${formatarDistancia(distanciaKm(posicao, ponto))} de você`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Texto>
            </View>

            <View style={estilos.acoes}>
              <Botao
                variante="suave"
                icone="directions"
                rotulo="Como chegar"
                onPress={aoAbrirRota}
                style={estilos.acao}
              />
              <Botao
                variante="suave"
                icone="share-variant"
                rotulo="Compartilhar"
                onPress={aoCompartilhar}
                style={estilos.acao}
              />
            </View>
          </View>

          <Secao titulo="Informações">
            <View style={estilos.cartao}>
              <Informacao
                icone="map-marker"
                rotulo="Endereço"
                valor={ponto.endereco}
                complemento={[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')}
              />
              {ponto.horarioFuncionamento ? (
                <Informacao
                  icone="clock-outline"
                  rotulo="Horário de funcionamento"
                  valor={ponto.horarioFuncionamento}
                />
              ) : null}
              {ponto.descricao ? (
                <Informacao
                  icone="information-outline"
                  rotulo="Descrição"
                  valor={ponto.descricao}
                />
              ) : null}
              <Informacao
                icone="crosshairs-gps"
                rotulo="Coordenadas"
                valor={`${ponto.latitude.toFixed(6)}, ${ponto.longitude.toFixed(6)}`}
              />
            </View>
          </Secao>

          {ponto.categorias?.length > 0 ? (
            <Secao titulo="Materiais aceitos">
              <View style={estilos.categorias}>
                {ponto.categorias.map(categoria => (
                  <EtiquetaCategoria
                    key={categoria.id}
                    id={categoria.id}
                    nome={categoria.nome}
                    grande
                  />
                ))}
              </View>
            </Secao>
          ) : null}

          {/* Leva ao perfil (nome, total de pontos e mapa) de quem cadastrou. */}
          <Pressionavel
            style={[estilos.cartao, estilos.perfil]}
            escala={0.98}
            onPress={() =>
              router.push({
                pathname: '/pessoa/[id]',
                params: { id: String(ponto.usuarioId) },
              })
            }
          >
            <Icone nome="account-circle-outline" cor={cores.primaria} />
            <Texto variante="corpoForte" style={estilos.flexivel}>
              {ehDono ? 'Ver meu perfil na comunidade' : 'Ver perfil de quem cadastrou'}
            </Texto>
            <Icone nome="chevron-right" cor={cores.tintaFraca} />
          </Pressionavel>

          {/* Gerenciar: so para quem cadastrou o ponto (a API tambem valida). */}
          {ehDono ? (
            <View style={[estilos.cartao, estilos.gerenciar]}>
              <View style={estilos.linha}>
                <Icone nome="shield-account" cor={cores.primaria} />
                <View style={estilos.flexivel}>
                  <Texto variante="cartao">Gerenciar ponto</Texto>
                  <Texto variante="detalhe" cor={cores.tintaSuave}>
                    Edite ou exclua as informações deste ponto.
                  </Texto>
                </View>
              </View>

              <View style={estilos.acoes}>
                <Botao
                  icone="pencil"
                  rotulo="Editar"
                  onPress={aoEditarPonto}
                  style={estilos.acao}
                />
                <Botao
                  variante="perigoSuave"
                  icone="trash-can-outline"
                  rotulo="Excluir"
                  carregando={excluindo}
                  onPress={aoConfirmarExcluir}
                  style={estilos.acao}
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[estilos.rodape, { paddingBottom: margens.bottom + espaco.md }]}>
        <Botao
          variante={favorito ? 'perigoSuave' : 'primario'}
          icone={favorito ? 'heart-off' : 'heart-plus'}
          rotulo={favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          carregando={salvando}
          onPress={aoToggleFavorito}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  flexivel: { flex: 1 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
  },

  foto: {
    height: ALTURA_FOTO,
    backgroundColor: cores.floresta,
    overflow: 'hidden',
  },
  fotoImagem: {
    width: '100%',
    height: '100%',
  },
  semFoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xxs,
  },
  fotoAcoes: {
    position: 'absolute',
    left: espaco.xl,
    right: espaco.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Sobe por cima da foto, com os cantos de cima arredondados.
  folha: {
    gap: espaco.xl,
    marginTop: -raios.lg,
    paddingTop: espaco.xl,
    paddingBottom: espaco.xl,
    borderTopLeftRadius: raios.lg,
    borderTopRightRadius: raios.lg,
    backgroundColor: cores.fundo,
  },
  titulo: {
    gap: espaco.xs,
    paddingHorizontal: espaco.xl,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espaco.xs,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xxs,
    borderRadius: raios.total,
  },
  statusPonto: {
    width: espaco.xs,
    height: espaco.xs,
    borderRadius: raios.total,
  },
  acoes: {
    flexDirection: 'row',
    gap: espaco.xs,
    marginTop: espaco.xs,
  },
  acao: {
    flex: 1,
    paddingHorizontal: espaco.sm,
  },

  cartao: {
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.baixa,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.sm,
  },
  infoTextos: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.xs,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    marginHorizontal: espaco.xl,
  },
  gerenciar: {
    marginHorizontal: espaco.xl,
  },

  rodape: {
    paddingTop: espaco.md,
    paddingHorizontal: espaco.xl,
    backgroundColor: cores.superficie,
    ...sombras.alta,
  },
});
