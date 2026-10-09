// ============================================================
// TELA: Home (Inicio) — VERSAO COM DADOS REAIS
// Rota: /(abas)/
//
// REGRA DE NEGOCIO: nada de dados ficticios/mockados.
// Todos os numeros vem de endpoints existentes:
//   - Total de pontos disponiveis: GET /pontos (count)
//   - Favoritos salvos:            GET /favoritos (count)
//   - Meus pontos cadastrados:     GET /pontos filtrado por usuarioId
//   - Categoria em destaque:       categoria mais frequente
//                                  computada a partir dos pontos.
//
// Se nao houver pontos no sistema, o bloco "Categoria do mes"
// e ocultado para nao mostrar info vazia/quebrada.
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { usePontos } from '@/hooks/usePontos';
import { CATEGORIAS } from '@/constantes/categorias';
import {
  Cores,
  Fontes,
  Espacamento,
  Bordas,
  Sombra,
  Gradientes,
} from '@/constantes/tema';
import { useState, useMemo, useCallback } from 'react';
import { Ponto } from '@/tipos/ponto';
import { listarFavoritos } from '@/servicos/favoritos';
import { MiniaturaPonto } from '@/componentes/MiniaturaPonto';
import { useLocalizacaoUsuario } from '@/hooks/useLocalizacaoUsuario';
import {
  distanciaKm,
  formatarDistancia,
  normalizarTexto,
} from '@/servicos/localizacao';

// ============================================================
// SUBCOMPONENTES
// ============================================================

// ---------- StatItem ----------
function StatItem({
  icone,
  valor,
  label,
  cor,
}: {
  icone: string;
  valor: string | number;
  label: string;
  cor: string;
}) {
  return (
    <View style={estilos.statItem}>
      <View style={[estilos.statIconeWrap, { backgroundColor: cor + '1A' }]}>
        <MaterialCommunityIcons name={icone as any} size={20} color={cor} />
      </View>
      <Text style={estilos.statValor}>{valor}</Text>
      <Text style={estilos.statLabel}>{label}</Text>
    </View>
  );
}

// ---------- CardAcaoRapida ----------
function CardAcaoRapida({
  icone,
  label,
  cor,
  aoTocar,
}: {
  icone: string;
  label: string;
  cor: string;
  aoTocar: () => void;
}) {
  return (
    <TouchableOpacity
      style={estilos.cardAcao}
      onPress={aoTocar}
      activeOpacity={0.85}
    >
      <View style={[estilos.cardAcaoIcone, { backgroundColor: cor + '1A' }]}>
        <MaterialCommunityIcons name={icone as any} size={26} color={cor} />
      </View>
      <Text style={estilos.cardAcaoLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ---------- ChipCategoria ----------
function ChipCategoria({
  nome,
  cor,
  ativo,
  aoTocar,
}: {
  nome: string;
  cor: string;
  ativo: boolean;
  aoTocar: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        estilos.chip,
        ativo && { backgroundColor: cor, borderColor: cor },
      ]}
      onPress={aoTocar}
      activeOpacity={0.85}
    >
      <Text style={[estilos.chipTexto, ativo && { color: Cores.branco }]}>
        {nome}
      </Text>
    </TouchableOpacity>
  );
}

// ---------- CardPonto ----------
// "distancia" ja vem formatada ("1,2 km") quando a posicao do usuario e conhecida.
function CardPonto({ ponto, distancia }: { ponto: Ponto; distancia?: string }) {
  return (
    <TouchableOpacity
      style={estilos.cardPonto}
      onPress={() => router.push(`/ponto/${ponto.id}`)}
      activeOpacity={0.85}
    >
      <View style={estilos.cardPontoIcone}>
        <MiniaturaPonto fotoUrl={ponto.fotoUrl} tamanho={44} />
      </View>
      <View style={estilos.cardPontoInfo}>
        <Text style={estilos.cardPontoNome} numberOfLines={1}>
          {ponto.nome}
        </Text>
        <Text style={estilos.cardPontoBairro} numberOfLines={1}>
          {[ponto.bairro, distancia ? `a ${distancia}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {ponto.horarioFuncionamento ? (
          <View style={estilos.cardPontoHorarioLinha}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={11}
              color={Cores.secundaria}
            />
            <Text style={estilos.cardPontoHorario} numberOfLines={1}>
              {ponto.horarioFuncionamento}
            </Text>
          </View>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={Cores.cinzaMedio}
      />
    </TouchableOpacity>
  );
}

// ============================================================
// TELA PRINCIPAL
// ============================================================

export default function TelaHome() {
  const { usuario } = useAutenticacao();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    number | undefined
  >(undefined);
  // Uma unica lista (sem filtro) alimenta os numeros da "Visao geral". O filtro
  // de categoria e aplicado aqui na tela e so afeta a lista "Pontos de coleta".
  const {
    pontos: todosPontos,
    carregando,
    erro,
    recarregar,
    atualizando,
    atualizar,
  } = usePontos();
  const { posicao, cidade } = useLocalizacaoUsuario();

  // Com a posicao do usuario, os pontos vem do mais perto para o mais longe.
  const pontosPorProximidade = useMemo(() => {
    if (!posicao) return todosPontos;
    return [...todosPontos].sort(
      (a, b) => distanciaKm(posicao, a) - distanciaKm(posicao, b)
    );
  }, [todosPontos, posicao]);

  const pontos = useMemo(() => {
    if (categoriaSelecionada === undefined) return pontosPorProximidade;
    return pontosPorProximidade.filter(p =>
      p.categorias?.some(c => c.id === categoriaSelecionada)
    );
  }, [pontosPorProximidade, categoriaSelecionada]);

  // Pontos na cidade onde o usuario esta (bloco "Perto de você").
  const pontosDaCidade = useMemo(() => {
    if (!cidade) return [];
    const alvo = normalizarTexto(cidade);
    return pontosPorProximidade.filter(p => normalizarTexto(p.cidade ?? '') === alvo);
  }, [pontosPorProximidade, cidade]);

  function distanciaAte(ponto: Ponto): string | undefined {
    return posicao ? formatarDistancia(distanciaKm(posicao, ponto)) : undefined;
  }

  // ----- Stat: quantidade de favoritos do usuario -----
  // Buscamos separado do hook usePontos para evitar acoplamento.
  const [qtdFavoritos, setQtdFavoritos] = useState<number | null>(null);

  const carregarFavoritos = useCallback(async () => {
    try {
      const lista = await listarFavoritos();
      setQtdFavoritos(lista.length);
    } catch {
      // Falha silenciosa: mostra "—" no stat de favoritos.
      setQtdFavoritos(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [carregarFavoritos])
  );

  function aoPuxarParaAtualizar() {
    atualizar();
    carregarFavoritos();
  }

  // ----- Stat: pontos cadastrados por mim -----
  // Filtra a lista de pontos pelo usuarioId do logado.
  const qtdMeusPontos = useMemo(() => {
    if (!usuario) return 0;
    return todosPontos.filter(p => p.usuarioId === usuario.id).length;
  }, [todosPontos, usuario]);

  // ----- Categoria em destaque (computada) -----
  // Conta ocorrencias de cada categoria entre os pontos e
  // escolhe a mais frequente. Se nenhuma, retorna null e o
  // bloco de destaque nao e renderizado.
  const categoriaDestaque = useMemo(() => {
    if (todosPontos.length === 0) return null;

    const contagem = new Map<number, number>();
    for (const p of todosPontos) {
      for (const c of p.categorias ?? []) {
        contagem.set(c.id, (contagem.get(c.id) ?? 0) + 1);
      }
    }

    if (contagem.size === 0) return null;

    // Pega o id com maior contagem
    let topId = -1;
    let topCount = -1;
    for (const [id, count] of contagem) {
      if (count > topCount) {
        topCount = count;
        topId = id;
      }
    }

    // Match na lista local CATEGORIAS para pegar icone/cor.
    // Se nao achar (categoria nova no back), nao mostra bloco.
    return CATEGORIAS.find(c => c.id === topId) ?? null;
  }, [todosPontos]);

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Usuário';

  // Total de pontos disponiveis no sistema (count direto da lista)
  const qtdTotalPontos = todosPontos.length;

  return (
    <ScrollView
      style={estilos.raiz}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Espacamento.xxl }}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={aoPuxarParaAtualizar}
          colors={[Cores.primaria]}
          tintColor={Cores.branco}
        />
      }
    >
      {/* ============================================ */}
      {/* HERO COM GRADIENTE                            */}
      {/* ============================================ */}
      <LinearGradient
        colors={Gradientes.verde}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.hero}
      >
        <View style={estilos.heroTopo}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.heroOla}>Olá, {primeiroNome}</Text>
            <Text style={estilos.heroNome}>Bem-vindo de volta 👋</Text>
          </View>

          {/* Minha conta: editar nome, trocar senha, sair e excluir conta. */}
          <TouchableOpacity
            onPress={() => router.push('/perfil')}
            style={estilos.botaoSair}
            activeOpacity={0.85}
            accessibilityLabel="Minha conta"
          >
            <MaterialCommunityIcons
              name="account-cog"
              size={20}
              color={Cores.branco}
            />
          </TouchableOpacity>
        </View>

        <View style={estilos.heroFraseLinha}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.heroFrase}>
              Pequenos atos.{'\n'}Grandes mudanças.
            </Text>
            <Text style={estilos.heroSubFrase}>
              Encontre pontos de coleta perto de você.
            </Text>
          </View>
          <MaterialCommunityIcons
            name="recycle"
            size={84}
            color={Cores.branco}
            style={estilos.heroIconeDecor}
          />
        </View>

        <View style={{ height: 60 }} />
      </LinearGradient>

      {/* ============================================ */}
      {/* STATS CARD (DADOS REAIS)                      */}
      {/* ============================================ */}
      <View style={estilos.statsCard}>
        <Text style={estilos.statsTitulo}>Visão geral</Text>

        <View style={estilos.statsLinha}>
          {/* Pontos disponiveis no sistema */}
          <StatItem
            icone="map-marker-multiple"
            valor={carregando ? '—' : qtdTotalPontos}
            label="pontos disponíveis"
            cor={Cores.primaria}
          />
          <View style={estilos.statsDivisor} />

          {/* Favoritos do usuario */}
          <StatItem
            icone="heart"
            valor={qtdFavoritos === null ? '—' : qtdFavoritos}
            label="favoritos"
            cor={Cores.secundaria}
          />
          <View style={estilos.statsDivisor} />

          {/* Pontos cadastrados pelo proprio usuario */}
          <StatItem
            icone="plus-circle"
            valor={carregando ? '—' : qtdMeusPontos}
            label="meus pontos"
            cor={Cores.acento}
          />
        </View>
      </View>

      {/* ============================================ */}
      {/* PERTO DE VOCE                                 */}
      {/* So aparece quando a cidade do usuario foi     */}
      {/* identificada pelo GPS.                        */}
      {/* ============================================ */}
      {cidade && !carregando && !erro ? (
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Perto de você</Text>
            <Text style={estilos.secaoSub}>{cidade}</Text>
          </View>

          {pontosDaCidade.length > 0 ? (
            <>
              <Text style={estilos.pertoResumo}>
                {pontosDaCidade.length === 1
                  ? `Já existe 1 ponto de coleta em ${cidade}.`
                  : `Já existem ${pontosDaCidade.length} pontos de coleta em ${cidade}.`}
              </Text>
              {pontosDaCidade.slice(0, 3).map(ponto => (
                <CardPonto
                  key={ponto.id}
                  ponto={ponto}
                  distancia={distanciaAte(ponto)}
                />
              ))}
              <TouchableOpacity
                style={[estilos.tentarNovamente, estilos.pertoBotao]}
                onPress={() =>
                  router.push({ pathname: '/(abas)/comunidade', params: { cidade } })
                }
              >
                <Text style={estilos.tentarNovamenteTexto}>
                  Ver a comunidade de {cidade}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={estilos.estadoVazio}>
              <MaterialCommunityIcons
                name="map-marker-plus-outline"
                size={32}
                color={Cores.cinzaMedio}
              />
              <Text style={estilos.estadoVazioTexto}>
                Ainda não há pontos de coleta em {cidade}. Seja a primeira
                pessoa a cadastrar um!
              </Text>
              <TouchableOpacity
                style={estilos.tentarNovamente}
                onPress={() => router.push('/ponto/novo')}
              >
                <Text style={estilos.tentarNovamenteTexto}>Cadastrar ponto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* ============================================ */}
      {/* ACOES RAPIDAS                                 */}
      {/* ============================================ */}
      <View style={estilos.secao}>
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.secaoTitulo}>Ações rápidas</Text>
        </View>

        <View style={estilos.acoesGrid}>
          <CardAcaoRapida
            icone="map-search"
            label="Ver Mapa"
            cor={Cores.primaria}
            aoTocar={() => router.push('/(abas)/mapa')}
          />
          <CardAcaoRapida
            icone="format-list-bulleted"
            label="Ver Pontos"
            cor={Cores.secundaria}
            aoTocar={() => router.push('/(abas)/lista')}
          />
          <CardAcaoRapida
            icone="plus-circle"
            label="Novo Ponto"
            cor={Cores.acento}
            aoTocar={() => router.push('/ponto/novo')}
          />
        </View>
      </View>

      {/* ============================================ */}
      {/* CATEGORIA EM DESTAQUE (computada de dados)    */}
      {/* So renderiza se houver categoria mais         */}
      {/* frequente identificada nos pontos.            */}
      {/* ============================================ */}
      {categoriaDestaque ? (
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Categoria mais aceita</Text>
            <Text style={estilos.secaoSub}>Pelos pontos do app</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              estilos.cardDestaque,
              { backgroundColor: categoriaDestaque.cor + '14' },
            ]}
            onPress={() => setCategoriaSelecionada(categoriaDestaque.id)}
          >
            <View
              style={[
                estilos.cardDestaqueIcone,
                { backgroundColor: categoriaDestaque.cor },
              ]}
            >
              <MaterialCommunityIcons
                name={categoriaDestaque.icone as any}
                size={36}
                color={Cores.branco}
              />
            </View>

            <View style={estilos.cardDestaqueInfo}>
              <Text style={estilos.cardDestaqueLabel}>EM DESTAQUE</Text>
              <Text style={estilos.cardDestaqueNome}>
                {categoriaDestaque.nome}
              </Text>
              <Text style={estilos.cardDestaqueDesc}>
                Categoria com mais pontos de coleta cadastrados na sua região.
              </Text>
            </View>

            <MaterialCommunityIcons
              name="arrow-right"
              size={22}
              color={categoriaDestaque.cor}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ============================================ */}
      {/* FILTRO POR CATEGORIA                          */}
      {/* ============================================ */}
      <View style={estilos.secao}>
        <Text style={estilos.secaoTitulo}>Filtrar por categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.chipsLinha}
        >
          <TouchableOpacity
            style={[
              estilos.chip,
              !categoriaSelecionada && {
                backgroundColor: Cores.primaria,
                borderColor: Cores.primaria,
              },
            ]}
            onPress={() => setCategoriaSelecionada(undefined)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                estilos.chipTexto,
                !categoriaSelecionada && { color: Cores.branco },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {CATEGORIAS.map(cat => (
            <ChipCategoria
              key={cat.id}
              nome={cat.nome}
              cor={cat.cor}
              ativo={categoriaSelecionada === cat.id}
              aoTocar={() =>
                setCategoriaSelecionada(
                  categoriaSelecionada === cat.id ? undefined : cat.id
                )
              }
            />
          ))}
        </ScrollView>
      </View>

      {/* ============================================ */}
      {/* PONTOS DE COLETA                              */}
      {/* ============================================ */}
      <View style={estilos.secao}>
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.secaoTitulo}>Pontos de coleta</Text>
          <TouchableOpacity onPress={() => router.push('/(abas)/lista')}>
            <Text style={estilos.verTodos}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {carregando && (
          <ActivityIndicator
            color={Cores.primaria}
            style={{ marginTop: Espacamento.lg }}
          />
        )}

        {erro && !carregando && (
          <View style={estilos.estadoVazio}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={32}
              color={Cores.cinzaMedio}
            />
            <Text style={estilos.estadoVazioTexto}>{erro}</Text>
            <TouchableOpacity
              style={estilos.tentarNovamente}
              onPress={recarregar}
            >
              <Text style={estilos.tentarNovamenteTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {!carregando && !erro && pontos.length === 0 && (
          <View style={estilos.estadoVazio}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={32}
              color={Cores.cinzaMedio}
            />
            <Text style={estilos.estadoVazioTexto}>
              {categoriaSelecionada === undefined
                ? 'Nenhum ponto cadastrado ainda.'
                : 'Nenhum ponto aceita esta categoria ainda.'}
            </Text>
            <TouchableOpacity
              style={estilos.tentarNovamente}
              onPress={() => router.push('/ponto/novo')}
            >
              <Text style={estilos.tentarNovamenteTexto}>
                Cadastrar primeiro ponto
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!carregando &&
          !erro &&
          pontos.slice(0, 5).map(ponto => (
            <CardPonto
              key={ponto.id}
              ponto={ponto}
              distancia={distanciaAte(ponto)}
            />
          ))}
      </View>
    </ScrollView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: Cores.cinzaClaro,
  },

  // ------------------ HERO ------------------
  hero: {
    paddingTop: 56,
    paddingHorizontal: Espacamento.lg,
    paddingBottom: Espacamento.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroOla: {
    fontSize: Fontes.normal,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Fontes.medio_peso,
  },
  heroNome: {
    fontSize: Fontes.titulo,
    color: Cores.branco,
    fontWeight: Fontes.muitoNegrito,
    marginTop: 2,
  },
  botaoSair: {
    width: 40,
    height: 40,
    borderRadius: Bordas.raioTotal,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFraseLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Espacamento.lg,
  },
  heroFrase: {
    fontSize: Fontes.tituloGrande,
    color: Cores.branco,
    fontWeight: Fontes.muitoNegrito,
    lineHeight: 34,
  },
  heroSubFrase: {
    fontSize: Fontes.normal,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Espacamento.xs,
    lineHeight: 20,
  },
  heroIconeDecor: {
    opacity: 0.25,
  },

  // ------------------ STATS CARD ------------------
  statsCard: {
    backgroundColor: Cores.branco,
    marginHorizontal: Espacamento.lg,
    marginTop: -50,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.md,
    ...Sombra.padrao,
  },
  statsTitulo: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.medio_peso,
    marginBottom: Espacamento.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconeWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.xs,
  },
  statValor: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
  },
  statLabel: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: 2,
    textAlign: 'center',
  },
  statsDivisor: {
    width: 1,
    height: 36,
    backgroundColor: Cores.cinzaBorda,
  },

  // ------------------ SECAO GENERICA ------------------
  secao: {
    marginTop: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
  },
  secaoCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Espacamento.sm,
  },
  secaoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
  },
  secaoSub: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
  },
  verTodos: {
    fontSize: Fontes.normal,
    color: Cores.primaria,
    fontWeight: Fontes.medio_peso,
  },

  // ------------------ PERTO DE VOCE ------------------
  pertoResumo: {
    fontSize: Fontes.normal,
    color: Cores.cinzaEscuro,
    marginBottom: Espacamento.sm,
  },
  pertoBotao: {
    alignSelf: 'center',
    marginTop: Espacamento.xs,
  },

  // ------------------ ACOES RAPIDAS ------------------
  acoesGrid: {
    flexDirection: 'row',
    gap: Espacamento.sm,
  },
  cardAcao: {
    flex: 1,
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    paddingVertical: Espacamento.md,
    alignItems: 'center',
    ...Sombra.suave,
  },
  cardAcaoIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.xs,
  },
  cardAcaoLabel: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
    textAlign: 'center',
  },

  // ------------------ CARD DESTAQUE ------------------
  cardDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Espacamento.md,
    borderRadius: Bordas.raioGrande,
    gap: Espacamento.md,
  },
  cardDestaqueIcone: {
    width: 60,
    height: 60,
    borderRadius: Bordas.raio,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sombra.suave,
  },
  cardDestaqueInfo: {
    flex: 1,
  },
  cardDestaqueLabel: {
    fontSize: 10,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.cinzaMedio,
    letterSpacing: 1,
  },
  cardDestaqueNome: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
    marginTop: 2,
  },
  cardDestaqueDesc: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaEscuro,
    marginTop: 2,
    lineHeight: 16,
  },

  // ------------------ CHIPS ------------------
  chipsLinha: {
    gap: Espacamento.sm,
    paddingRight: Espacamento.lg,
    // Respiro em relacao ao titulo "Filtrar por categoria" logo acima.
    paddingTop: Espacamento.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.md,
    paddingVertical: 6,
    backgroundColor: Cores.branco,
  },
  chipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },

  // ------------------ CARD PONTO ------------------
  cardPonto: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    padding: Espacamento.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Espacamento.sm,
    ...Sombra.suave,
  },
  cardPontoIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.primariaFundo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Espacamento.sm,
  },
  cardPontoInfo: {
    flex: 1,
  },
  cardPontoNome: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.preto,
  },
  cardPontoBairro: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    marginTop: 2,
  },
  cardPontoHorarioLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardPontoHorario: {
    fontSize: Fontes.pequena,
    color: Cores.secundaria,
  },

  // ------------------ ESTADO VAZIO / ERRO ------------------
  estadoVazio: {
    alignItems: 'center',
    paddingVertical: Espacamento.xl,
    gap: Espacamento.sm,
  },
  estadoVazioTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    textAlign: 'center',
  },
  tentarNovamente: {
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm,
    backgroundColor: Cores.primariaFundo,
    borderRadius: Bordas.raioTotal,
  },
  tentarNovamenteTexto: {
    fontSize: Fontes.normal,
    color: Cores.primaria,
    fontWeight: Fontes.medio_peso,
  },
});
