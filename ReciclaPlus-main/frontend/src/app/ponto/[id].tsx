// ============================================================
// TELA: Detalhes do Ponto — VERSAO COM FOTO + ERRO MELHORADO
// Rota: /ponto/[id]
//
// MUDANCAS:
//   1. Mostra a FOTO do ponto no topo (ponto.fotoUrl):
//        - Se houver URL: <Image>
//        - Se nao: placeholder verde com icone recycle
//   2. Erro nao chama mais router.back() automatico:
//        - Antes: qualquer falha de rede ja voltava pra tela
//          anterior, dando impressao de "tela em branco".
//        - Agora: mostra mensagem de erro com botao
//          "Tentar novamente" e botao "Voltar".
//   3. Coordenadas exibidas no card de localizacao.
//
// CAMPOS RENDERIZADOS (todos do tipo Ponto):
//   foto, nome, status, bairro, endereco, horario,
//   descricao, categorias, latitude/longitude.
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { buscarPonto, removerPonto } from '@/servicos/pontos';
import {
  adicionarFavorito,
  removerFavorito,
  removerFavoritoPorPonto,
  verificarFavorito,
} from '@/servicos/favoritos';
import { useAutenticacao } from '@/hooks/useAutenticacao';
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

export default function TelaDetalhesPonto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAutenticacao();

  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [favoritoId, setFavoritoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Carrega ponto e status de favorito. Em caso de erro,
  // armazena no state em vez de voltar imediatamente — usuario
  // pode tentar novamente.
  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarPonto(Number(id));
      setPonto(dados);

      if (usuario) {
        const status = await verificarFavorito(Number(id));
        setFavorito(status.favorito);
        setFavoritoId(status.favoritoId);
      }
    } catch {
      setErro('Nao foi possivel carregar os dados deste ponto.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, usuario]);

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
      Alert.alert('Erro', 'Nao foi possivel atualizar o favorito.');
    } finally {
      setSalvando(false);
    }
  }

  // Abre a tela separada de edicao. A permissao real tambem sera
  // validada no backend, mas aqui so exibimos a acao para o dono.
  function aoEditarPonto() {
    if (!ponto) return;
    router.push(`/ponto/editar/${ponto.id}`);
  }

  // Excluir ponto e uma acao destrutiva: primeiro pedimos confirmacao,
  // depois chamamos DELETE /pontos/:id e voltamos para a lista.
  function aoConfirmarExcluir() {
    if (!ponto) return;

    Alert.alert(
      'Excluir ponto',
      `Tem certeza que deseja excluir "${ponto.nome}"? Esta acao nao pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setExcluindo(true);
            try {
              await removerPonto(ponto.id);
              Alert.alert('Ponto excluido', 'O ponto foi removido com sucesso.', [
                { text: 'OK', onPress: () => router.replace('/(abas)/lista') },
              ]);
            } catch {
              Alert.alert('Erro', 'Nao foi possivel excluir o ponto. Tente novamente.');
            } finally {
              setExcluindo(false);
            }
          },
        },
      ]
    );
  }

  // -------- Estados especiais --------

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

  // ------- Conteudo normal -------

  // Tem foto valida? string nao vazia e parece URL.
  const temFoto = !!ponto.fotoUrl && ponto.fotoUrl.trim().length > 0;
  const podeGerenciar = Boolean(usuario && ponto.usuarioId === usuario.id);

  return (
    <View style={estilos.raiz}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ============================================ */}
        {/* FOTO DO PONTO (ou placeholder)               */}
        {/* ============================================ */}
        <View style={estilos.fotoContainer}>
          {temFoto ? (
            <Image
              source={{ uri: ponto.fotoUrl }}
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

          {/* Overlay com botoes voltar/favorito */}
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

        {/* ============================================ */}
        {/* HEADER COM NOME + STATUS                      */}
        {/* ============================================ */}
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
            <Text style={estilos.bairroTexto}>{ponto.bairro}</Text>
          </View>
        </View>

        {/* ============================================ */}
        {/* CONTEUDO                                       */}
        {/* ============================================ */}
        <View style={estilos.conteudo}>

          {/* Informacoes */}
          <View style={estilos.secao}>
            <Text style={estilos.secaoTitulo}>Informacoes</Text>

            <View style={estilos.infoItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={Cores.primaria}
              />
              <View style={estilos.infoTexto}>
                <Text style={estilos.infoLabel}>Endereco</Text>
                <Text style={estilos.infoValor}>{ponto.endereco}</Text>
                <Text style={estilos.infoBairro}>{ponto.bairro}</Text>
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
                    Horario de funcionamento
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
                  <Text style={estilos.infoLabel}>Descricao</Text>
                  <Text style={estilos.infoValor}>{ponto.descricao}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Categorias aceitas */}
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

          {/* Coordenadas */}
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

          {/* Gerenciamento do ponto: apenas o usuario que cadastrou ve. */}
          {podeGerenciar ? (
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
                    Este ponto foi cadastrado pela sua conta.
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

      {/* ============================================ */}
      {/* BOTAO FIXO: FAVORITAR                         */}
      {/* ============================================ */}
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

// ============================================================
// ESTILOS
// ============================================================
const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: Cores.cinzaClaro },

  // -------- Loading / Erro --------
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

  // -------- Foto --------
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

  // -------- Header --------
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

  // -------- Conteudo --------
  conteudo: { padding: Espacamento.lg, paddingTop: Espacamento.md },

  secao: { marginBottom: Espacamento.lg },
  secaoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginBottom: Espacamento.sm,
  },

  // Item de info
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

  // Categorias
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

  // Coordenadas
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.xs,
  },
  coordTexto: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
  },

  // -------- Gerenciamento --------
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

  // Rodape fixo
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
