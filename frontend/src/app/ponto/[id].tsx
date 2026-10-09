// Tela de detalhes do ponto.
// Exibe foto, dados, favoritos e acoes de gerenciamento.

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
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
import { CATEGORIAS } from '@/constantes/categorias';
import {
  Cores,
  CoresCategorias,
  Fontes,
  Espacamento,
  Bordas,
  Sombra,
} from '@/constantes/tema';
import { Ponto } from '@/tipos/ponto';
import { alertar } from '@/servicos/alerta';

export default function TelaDetalhesPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();
  const { posicao } = useLocalizacaoUsuario();

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
      <View style={estilos.loading}>
        <ActivityIndicator size="large" color={Cores.primaria} />
        <Text style={estilos.loadingTexto}>Carregando ponto...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={estilos.loading}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={56}
          color={Cores.erro}
        />
        <Text style={estilos.erroTitulo}>Ops!</Text>
        <Text style={estilos.erroTexto}>{erro}</Text>
        <View style={estilos.erroBotoes}>
          <TouchableOpacity
            style={[estilos.btnErroSec]}
            onPress={() => router.back()}
          >
            <Text style={estilos.btnErroSecTexto}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnErroPrim} onPress={carregar}>
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={Cores.branco}
            />
            <Text style={estilos.btnErroPrimTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!ponto) return null;

  const fotoUri = montarUrlFoto(ponto.fotoUrl);
  const ehDono = usuario?.id === ponto.usuarioId;

  return (
    <View style={estilos.raiz}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={estilos.fotoContainer}>
          {fotoUri && fotoUri !== fotoComErro ? (
            <Image
              source={{ uri: fotoUri }}
              onError={() => setFotoComErro(fotoUri)}
              style={estilos.fotoImg}
              resizeMode="cover"
            />
          ) : (
            <View style={estilos.fotoPlaceholder}>
              <MaterialCommunityIcons
                name="recycle"
                size={88}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={estilos.fotoPlaceholderTexto}>Sem foto</Text>
            </View>
          )}

          <View style={estilos.fotoOverlay}>
            <TouchableOpacity
              style={estilos.btnFlutuante}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={Cores.preto}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.btnFlutuante}
              onPress={aoToggleFavorito}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator size="small" color={Cores.primaria} />
              ) : (
                <MaterialCommunityIcons
                  name={favorito ? 'heart' : 'heart-outline'}
                  size={22}
                  color={favorito ? '#FF5252' : Cores.preto}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.header}>
          <View
            style={[
              estilos.statusBadge,
              {
                backgroundColor:
                  ponto.status === 'Ativo'
                    ? Cores.sucessoFundo
                    : Cores.cinzaClaro,
              },
            ]}
          >
            <View
              style={[
                estilos.statusPonto,
                {
                  backgroundColor:
                    ponto.status === 'Ativo'
                      ? Cores.sucesso
                      : Cores.cinzaMedio,
                },
              ]}
            />
            <Text
              style={[
                estilos.statusTexto,
                {
                  color:
                    ponto.status === 'Ativo'
                      ? Cores.sucesso
                      : Cores.cinzaMedio,
                },
              ]}
            >
              {ponto.status}
            </Text>
          </View>

          <Text style={estilos.nome}>{ponto.nome}</Text>
          <View style={estilos.bairroLinha}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={Cores.cinzaMedio}
            />
            <Text style={estilos.bairroTexto}>
              {[
                ponto.bairro,
                posicao
                  ? `a ${formatarDistancia(distanciaKm(posicao, ponto))} de você`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>

        <View style={estilos.conteudo}>

          <View style={[estilos.secao, estilos.acoesLinha]}>
            <TouchableOpacity
              style={estilos.btnAcao}
              onPress={aoAbrirRota}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="directions"
                size={20}
                color={Cores.primaria}
              />
              <Text style={estilos.btnAcaoTexto}>Como chegar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.btnAcao}
              onPress={aoCompartilhar}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color={Cores.primaria}
              />
              <Text style={estilos.btnAcaoTexto}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.secao}>
            <Text style={estilos.secaoTitulo}>Informações</Text>

            <View style={estilos.infoItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={Cores.primaria}
              />
              <View style={estilos.infoTexto}>
                <Text style={estilos.infoLabel}>Endereço</Text>
                <Text style={estilos.infoValor}>{ponto.endereco}</Text>
                <Text style={estilos.infoBairro}>
                  {[ponto.bairro, ponto.cidade].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>

            {ponto.horarioFuncionamento ? (
              <View style={estilos.infoItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={Cores.primaria}
                />
                <View style={estilos.infoTexto}>
                  <Text style={estilos.infoLabel}>
                    Horário de funcionamento
                  </Text>
                  <Text style={estilos.infoValor}>
                    {ponto.horarioFuncionamento}
                  </Text>
                </View>
              </View>
            ) : null}

            {ponto.descricao ? (
              <View style={estilos.infoItem}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={Cores.primaria}
                />
                <View style={estilos.infoTexto}>
                  <Text style={estilos.infoLabel}>Descrição</Text>
                  <Text style={estilos.infoValor}>{ponto.descricao}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {ponto.categorias?.length > 0 && (
            <View style={estilos.secao}>
              <Text style={estilos.secaoTitulo}>Materiais aceitos</Text>
              <View style={estilos.categoriasGrid}>
                {ponto.categorias.map(cat => {
                  const catLocal = CATEGORIAS.find(c => c.id === cat.id);
                  const cor = CoresCategorias[cat.id] ?? Cores.primaria;
                  return (
                    <View
                      key={cat.id}
                      style={[
                        estilos.categoriaChip,
                        {
                          backgroundColor: cor + '1A',
                          borderColor: cor,
                        },
                      ]}
                    >
                      {catLocal && (
                        <MaterialCommunityIcons
                          name={catLocal.icone as any}
                          size={16}
                          color={cor}
                        />
                      )}
                      <Text
                        style={[
                          estilos.categoriaChipTexto,
                          { color: cor },
                        ]}
                      >
                        {cat.nome}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={[estilos.secao, estilos.coordBox]}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={18}
              color={Cores.cinzaMedio}
            />
            <Text style={estilos.coordTexto}>
              {ponto.latitude.toFixed(6)}, {ponto.longitude.toFixed(6)}
            </Text>
          </View>

          {/* Leva ao perfil (nome, total de pontos e mapa) de quem cadastrou. */}
          <TouchableOpacity
            style={[estilos.secao, estilos.perfilLink]}
            onPress={() =>
              router.push({
                pathname: '/pessoa/[id]',
                params: { id: String(ponto.usuarioId) },
              })
            }
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={22}
              color={Cores.primaria}
            />
            <Text style={estilos.perfilLinkTexto}>
              {ehDono ? 'Ver meu perfil na comunidade' : 'Ver perfil de quem cadastrou'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={Cores.cinzaMedio}
            />
          </TouchableOpacity>

          {/* Gerenciar: so para quem cadastrou o ponto (a API tambem valida). */}
          {ehDono ? (
            <View style={[estilos.secao, estilos.gerenciarBox]}>
              <View style={estilos.gerenciarCabecalho}>
                <MaterialCommunityIcons
                  name="shield-account"
                  size={20}
                  color={Cores.primaria}
                />
                <View style={estilos.gerenciarTextoArea}>
                  <Text style={estilos.gerenciarTitulo}>Gerenciar ponto</Text>
                  <Text style={estilos.gerenciarSub}>
                    Edite ou exclua as informações deste ponto.
                  </Text>
                </View>
              </View>

              <View style={estilos.gerenciarAcoes}>
                <TouchableOpacity
                  style={[estilos.btnGerenciar, estilos.btnEditarPonto]}
                  onPress={aoEditarPonto}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={Cores.branco}
                  />
                  <Text style={estilos.btnEditarTexto}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.btnGerenciar,
                    estilos.btnExcluirPonto,
                    excluindo && estilos.btnDesabilitado,
                  ]}
                  onPress={aoConfirmarExcluir}
                  disabled={excluindo}
                  activeOpacity={0.85}
                >
                  {excluindo ? (
                    <ActivityIndicator size="small" color={Cores.erro} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={Cores.erro}
                      />
                      <Text style={estilos.btnExcluirTexto}>Excluir</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <TouchableOpacity
          style={[
            estilos.btnFavoritoGrande,
            favorito && estilos.btnFavoritoAtivo,
          ]}
          onPress={aoToggleFavorito}
          disabled={salvando}
          activeOpacity={0.85}
        >
          {salvando ? (
            <ActivityIndicator
              color={favorito ? Cores.erro : Cores.branco}
              size="small"
            />
          ) : (
            <>
              <MaterialCommunityIcons
                name={favorito ? 'heart-off' : 'heart-plus'}
                size={20}
                color={favorito ? Cores.erro : Cores.branco}
              />
              <Text
                style={[
                  estilos.btnFavoritoTexto,
                  favorito && { color: Cores.erro },
                ]}
              >
                {favorito ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.cinzaClaro,
    padding: Espacamento.lg,
    gap: Espacamento.sm,
  },
  loadingTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    marginTop: Espacamento.sm,
  },
  erroTitulo: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginTop: Espacamento.sm,
  },
  erroTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaEscuro,
    textAlign: 'center',
    marginBottom: Espacamento.md,
  },
  erroBotoes: {
    flexDirection: 'row',
    gap: Espacamento.sm,
  },
  btnErroSec: {
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raio,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    backgroundColor: Cores.branco,
  },
  btnErroSecTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaEscuro,
    fontWeight: Fontes.negrito,
  },
  btnErroPrim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raio,
    backgroundColor: Cores.primaria,
  },
  btnErroPrimTexto: {
    fontSize: Fontes.normal,
    color: Cores.branco,
    fontWeight: Fontes.negrito,
  },

  fotoContainer: {
    width: '100%',
    height: 240,
    backgroundColor: Cores.primaria,
  },
  fotoImg: {
    width: '100%',
    height: '100%',
  },
  fotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fotoPlaceholderTexto: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
  },
  fotoOverlay: {
    position: 'absolute',
    top: 48,
    left: Espacamento.lg,
    right: Espacamento.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btnFlutuante: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Sombra.padrao,
  },

  header: {
    backgroundColor: Cores.branco,
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.md,
    paddingBottom: Espacamento.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 4,
    borderRadius: Bordas.raioTotal,
    marginBottom: Espacamento.xs,
  },
  statusPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.muitoNegrito,
  },
  nome: {
    fontSize: Fontes.tituloGrande,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    lineHeight: 32,
  },
  bairroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  bairroTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
  },

  conteudo: { padding: Espacamento.lg, paddingTop: Espacamento.md },

  secao: { marginBottom: Espacamento.lg },

  acoesLinha: {
    flexDirection: 'row',
    gap: Espacamento.sm,
  },
  btnAcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Cores.primariaFundo,
    borderRadius: Bordas.raio,
    paddingVertical: Espacamento.sm + 4,
  },
  btnAcaoTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.primaria,
  },
  secaoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginBottom: Espacamento.sm,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    padding: Espacamento.md,
    marginBottom: Espacamento.sm,
    ...Sombra.suave,
  },
  infoTexto: { flex: 1, marginLeft: Espacamento.sm },
  infoLabel: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.medio_peso,
    marginBottom: 2,
  },
  infoValor: {
    fontSize: Fontes.normal,
    color: Cores.preto,
  },
  infoBairro: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: 2,
  },

  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.sm,
  },
  categoriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 6,
    gap: 4,
  },
  categoriaChipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.negrito,
  },

  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.xs,
  },
  coordTexto: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
  },

  perfilLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    padding: Espacamento.md,
  },
  perfilLinkTexto: {
    flex: 1,
    fontSize: Fontes.normal,
    fontWeight: Fontes.medio_peso,
    color: Cores.preto,
  },

  gerenciarBox: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    padding: Espacamento.md,
    ...Sombra.suave,
  },
  gerenciarCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Espacamento.md,
    gap: Espacamento.sm,
  },
  gerenciarTextoArea: {
    flex: 1,
  },
  gerenciarTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
  },
  gerenciarSub: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: 1,
  },
  gerenciarAcoes: {
    flexDirection: 'row',
    gap: Espacamento.sm,
  },
  btnGerenciar: {
    flex: 1,
    height: 44,
    borderRadius: Bordas.raio,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnEditarPonto: {
    backgroundColor: Cores.primaria,
  },
  btnExcluirPonto: {
    backgroundColor: Cores.erroFundo,
    borderWidth: 1.5,
    borderColor: Cores.erro,
  },
  btnDesabilitado: {
    opacity: 0.7,
  },
  btnEditarTexto: {
    fontSize: Fontes.normal,
    color: Cores.branco,
    fontWeight: Fontes.negrito,
  },
  btnExcluirTexto: {
    fontSize: Fontes.normal,
    color: Cores.erro,
    fontWeight: Fontes.negrito,
  },

  rodape: {
    padding: Espacamento.lg,
    backgroundColor: Cores.branco,
    borderTopWidth: 1,
    borderTopColor: Cores.cinzaBorda,
  },
  btnFavoritoGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raio,
    height: 52,
    gap: Espacamento.sm,
  },
  btnFavoritoAtivo: {
    backgroundColor: Cores.erroFundo,
    borderWidth: 1.5,
    borderColor: Cores.erro,
  },
  btnFavoritoTexto: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.branco,
  },
});
