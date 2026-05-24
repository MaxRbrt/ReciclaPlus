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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Ponto } from '@/tipos/ponto';
import { listarFavoritos } from '@/servicos/favoritos';
import { useFocusEffect } from 'expo-router';

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
function CardPonto({ ponto }: { ponto: Ponto }) {
  return (
    <TouchableOpacity
      style={estilos.cardPonto}
      onPress={() => router.push(`/ponto/${ponto.id}`)}
      activeOpacity={0.85}
    >
      <View style={estilos.cardPontoIcone}>
        <MaterialCommunityIcons
          name="map-marker"
          size={22}
          color={Cores.primaria}
        />
      </View>
      <View style={estilos.cardPontoInfo}>
        <Text style={estilos.cardPontoNome} numberOfLines={1}>
          {ponto.nome}
        </Text>
        <Text style={estilos.cardPontoBairro} numberOfLines={1}>
          {ponto.bairro}
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
  const { usuario, sair } = useAutenticacao();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    number | undefined
  >(undefined);
  const { pontos, carregando, erro, recarregar } = usePontos(categoriaSelecionada);

  // ----- Stat: quantidade de favoritos do usuario -----
  // Buscamos separado do hook usePontos para evitar acoplamento.
  const [qtdFavoritos, setQtdFavoritos] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregarFavoritos() {
        try {
          const lista = await listarFavoritos();
          if (ativo) setQtdFavoritos(lista.length);
        } catch {
          // Falha silenciosa: mostra "—" no stat de favoritos.
          if (ativo) setQtdFavoritos(null);
        }
      }
      carregarFavoritos();
      return () => {
        ativo = false;
      };
    }, [])
  );

  // ----- Stat: pontos cadastrados por mim -----
  // Filtra a lista de pontos pelo usuarioId do logado.
  const qtdMeusPontos = useMemo(() => {
    if (!usuario) return 0;
    return pontos.filter(p => p.usuarioId === usuario.id).length;
  }, [pontos, usuario]);

  // ----- Categoria em destaque (computada) -----
  // Conta ocorrencias de cada categoria entre os pontos e
  // escolhe a mais frequente. Se nenhuma, retorna null e o
  // bloco de destaque nao e renderizado.
  const categoriaDestaque = useMemo(() => {
    if (pontos.length === 0) return null;

    const contagem = new Map<number, number>();
    for (const p of pontos) {
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
  }, [pontos]);

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Usuario';

  // Total de pontos disponiveis no sistema (count direto da lista)
  const qtdTotalPontos = pontos.length;

  return (
    <ScrollView
      style={estilos.raiz}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Espacamento.xxl }}
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
            <Text style={estilos.heroOla}>Ola, {primeiroNome}</Text>
            <Text style={estilos.heroNome}>Bem-vindo de volta 👋</Text>
          </View>

          <TouchableOpacity
            onPress={sair}
            style={estilos.botaoSair}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={Cores.branco}
            />
          </TouchableOpacity>
        </View>

        <View style={estilos.heroFraseLinha}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.heroFrase}>
              Pequenos atos.{'\n'}Grandes mudancas.
            </Text>
            <Text style={estilos.heroSubFrase}>
              Encontre pontos de coleta perto de voce.
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
        <Text style={estilos.statsTitulo}>Visao geral</Text>

        <View style={estilos.statsLinha}>
          {/* Pontos disponiveis no sistema */}
          <StatItem
            icone="map-marker-multiple"
            valor={carregando ? '—' : qtdTotalPontos}
            label="pontos disponiveis"
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
      {/* ACOES RAPIDAS                                 */}
      {/* ============================================ */}
      <View style={estilos.secao}>
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.secaoTitulo}>Acoes rapidas</Text>
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
                Categoria com mais pontos de coleta cadastrados na sua regiao.
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
              Nenhum ponto cadastrado ainda.
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
            <CardPonto key={ponto.id} ponto={ponto} />
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
