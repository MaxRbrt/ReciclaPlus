// ============================================================
// TELA: Inicio
// Rota: /(abas)/
//
// Todos os numeros saem de dados reais:
//   - Pontos disponiveis e "meus pontos": lista de GET /pontos
//   - Favoritos:                          GET /favoritos
//   - Categoria mais aceita:              a mais frequente entre os pontos
//   - Perto de voce:                      pontos da cidade do usuario (GPS)
//
// Blocos sem dados (sem pontos, sem cidade identificada) nao aparecem.
// ============================================================

import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { Botao } from '@/componentes/Botao';
import { BotaoIcone } from '@/componentes/BotaoIcone';
import { CartaoPonto } from '@/componentes/CartaoPonto';
import { EstadoTela } from '@/componentes/EstadoTela';
import { FiltroCategorias } from '@/componentes/FiltroCategorias';
import { FundoOrganico } from '@/componentes/FundoOrganico';
import { Icone, NomeIcone } from '@/componentes/Icone';
import { Pressionavel } from '@/componentes/Pressionavel';
import { Secao } from '@/componentes/Secao';
import { Texto } from '@/componentes/Texto';
import { CATEGORIAS } from '@/constantes/categorias';
import { FORMAS_DESTAQUE } from '@/constantes/formas';
import {
  comAlfa,
  cores,
  espaco,
  movimento,
  raios,
  sombras,
  tamanhos,
} from '@/constantes/tema';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { useLocalizacaoUsuario } from '@/hooks/useLocalizacaoUsuario';
import { usePontos } from '@/hooks/usePontos';
import { listarFavoritos } from '@/servicos/favoritos';
import {
  distanciaKm,
  formatarDistancia,
  normalizarTexto,
} from '@/servicos/localizacao';
import { Ponto } from '@/tipos/ponto';

// Par fundo/texto dos blocos coloridos: tres tons do mesmo verde.
type Tom = { fundo: string; texto: string };
const TOM_ESCURO: Tom = { fundo: cores.primaria, texto: cores.sobreEscuro };
const TOM_LIMA: Tom = { fundo: cores.lima, texto: cores.tinta };
const TOM_CLARO: Tom = { fundo: cores.nevoa, texto: cores.tinta };

// ============================================================
// SUBCOMPONENTES (so desta tela)
// ============================================================

function Numero({
  valor,
  legenda,
  tom,
}: {
  valor: string | number;
  legenda: string;
  tom: Tom;
}) {
  return (
    <View style={[estilos.numero, { backgroundColor: tom.fundo }]}>
      <Texto variante="numero" cor={tom.texto}>
        {valor}
      </Texto>
      <Texto variante="detalhe" cor={tom.texto} style={estilos.centro}>
        {legenda}
      </Texto>
    </View>
  );
}

function Atalho({
  icone,
  rotulo,
  tom,
  onPress,
}: {
  icone: NomeIcone;
  rotulo: string;
  tom: Tom;
  onPress: () => void;
}) {
  return (
    <Pressionavel
      style={[estilos.atalho, { backgroundColor: tom.fundo }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <Icone nome={icone} tamanho={tamanhos.iconeMaior} cor={tom.texto} />
      <Texto variante="corpoForte" cor={tom.texto}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

// ============================================================
// TELA PRINCIPAL
// ============================================================

export default function TelaHome() {
  const { usuario } = useAutenticacao();
  const margens = useSafeAreaInsets();
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

  // Cada bloco entra subindo, um pouco depois do anterior. Com movimento
  // reduzido no aparelho, os blocos ja aparecem no lugar.
  const movimentoReduzido = useReducedMotion();
  function entrada(ordem: number) {
    if (movimentoReduzido) return undefined;
    return FadeInDown.delay(ordem * movimento.escalonar)
      .springify()
      .damping(movimento.molaEntrada.damping)
      .stiffness(movimento.molaEntrada.stiffness);
  }

  return (
    <ScrollView
      style={estilos.raiz}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={aoPuxarParaAtualizar}
          colors={[cores.primaria]}
          tintColor={cores.sobreEscuro}
        />
      }
    >
      {/* ============================================ */}
      {/* DESTAQUE COM FORMAS ORGANICAS                 */}
      {/* ============================================ */}
      <View style={[estilos.destaque, { paddingTop: margens.top + espaco.lg }]}>
        <FundoOrganico formas={FORMAS_DESTAQUE} animado />

        <View style={estilos.destaqueTopo}>
          <Texto variante="corpoForte" cor={cores.sobreEscuroSuave}>
            Olá, {primeiroNome}
          </Texto>
          {/* Minha conta: editar nome, trocar senha, sair e excluir conta. */}
          <BotaoIcone
            icone="account-cog"
            rotulo="Minha conta"
            variante="translucido"
            onPress={() => router.push('/perfil')}
          />
        </View>

        <Texto variante="display" cor={cores.sobreEscuro} style={estilos.frase}>
          Pequenos atos.{'\n'}Grandes mudanças.
        </Texto>
        <Texto cor={cores.sobreEscuroSuave} style={estilos.subFrase}>
          Encontre pontos de coleta perto de você.
        </Texto>
      </View>

      {/* ============================================ */}
      {/* VISAO GERAL (DADOS REAIS)                     */}
      {/* ============================================ */}
      <Animated.View entering={entrada(0)} style={estilos.visaoGeral}>
        <Numero
          valor={carregando ? '—' : qtdTotalPontos}
          legenda="pontos disponíveis"
          tom={TOM_ESCURO}
        />
        <Numero
          valor={qtdFavoritos === null ? '—' : qtdFavoritos}
          legenda="favoritos"
          tom={TOM_LIMA}
        />
        <Numero
          valor={carregando ? '—' : qtdMeusPontos}
          legenda="meus pontos"
          tom={TOM_CLARO}
        />
      </Animated.View>

      {/* ============================================ */}
      {/* PERTO DE VOCE                                 */}
      {/* So aparece quando a cidade do usuario foi     */}
      {/* identificada pelo GPS.                        */}
      {/* ============================================ */}
      {cidade && !carregando && !erro ? (
        <Animated.View entering={entrada(1)}>
          <Secao titulo="Perto de você" complemento={cidade}>
            {pontosDaCidade.length > 0 ? (
              <>
                <Texto cor={cores.tintaSuave}>
                  {pontosDaCidade.length === 1
                    ? `Já existe 1 ponto de coleta em ${cidade}.`
                    : `Já existem ${pontosDaCidade.length} pontos de coleta em ${cidade}.`}
                </Texto>
                {pontosDaCidade.slice(0, 3).map(ponto => (
                  <CartaoPonto
                    key={ponto.id}
                    nome={ponto.nome}
                    fotoUrl={ponto.fotoUrl}
                    linhas={[ponto.bairro]}
                    destaque={ponto.horarioFuncionamento}
                    iconeDestaque="clock-outline"
                    distancia={distanciaAte(ponto)}
                    onPress={() => router.push(`/ponto/${ponto.id}`)}
                  />
                ))}
                <Botao
                  compacto
                  variante="suave"
                  rotulo={`Ver a comunidade de ${cidade}`}
                  onPress={() =>
                    router.push({ pathname: '/(abas)/comunidade', params: { cidade } })
                  }
                />
              </>
            ) : (
              <EstadoTela
                icone="map-marker-plus-outline"
                mensagem={`Ainda não há pontos de coleta em ${cidade}. Seja a primeira pessoa a cadastrar um!`}
                acao={{
                  rotulo: 'Cadastrar ponto',
                  onPress: () => router.push('/ponto/novo'),
                }}
              />
            )}
          </Secao>
        </Animated.View>
      ) : null}

      {/* ============================================ */}
      {/* ACOES RAPIDAS                                 */}
      {/* ============================================ */}
      <Animated.View entering={entrada(2)}>
        <Secao titulo="Ações rápidas">
          <View style={estilos.atalhos}>
            <Atalho
              icone="map-search"
              rotulo="Ver Mapa"
              tom={TOM_ESCURO}
              onPress={() => router.push('/(abas)/mapa')}
            />
            <Atalho
              icone="format-list-bulleted"
              rotulo="Ver Pontos"
              tom={TOM_CLARO}
              onPress={() => router.push('/(abas)/lista')}
            />
            <Atalho
              icone="plus-circle"
              rotulo="Novo Ponto"
              tom={TOM_LIMA}
              onPress={() => router.push('/ponto/novo')}
            />
          </View>
        </Secao>
      </Animated.View>

      {/* ============================================ */}
      {/* CATEGORIA EM DESTAQUE (computada de dados)    */}
      {/* So renderiza se houver categoria mais         */}
      {/* frequente identificada nos pontos.            */}
      {/* ============================================ */}
      {categoriaDestaque ? (
        <Animated.View entering={entrada(3)}>
          <Secao titulo="Categoria mais aceita" complemento="Pelos pontos do app">
            <Pressionavel
              escala={0.98}
              style={[
                estilos.categoria,
                { backgroundColor: comAlfa(categoriaDestaque.cor, 0.12) },
              ]}
              onPress={() => setCategoriaSelecionada(categoriaDestaque.id)}
            >
              <View
                style={[
                  estilos.categoriaIcone,
                  { backgroundColor: categoriaDestaque.cor },
                ]}
              >
                <Icone
                  nome={categoriaDestaque.icone}
                  tamanho={tamanhos.iconeMaior + espaco.xs}
                  cor={cores.sobreEscuro}
                />
              </View>

              <View style={estilos.categoriaInfo}>
                <Texto variante="rotulo" cor={categoriaDestaque.cor}>
                  Em destaque
                </Texto>
                <Texto variante="titulo">{categoriaDestaque.nome}</Texto>
                <Texto variante="detalhe" cor={cores.tintaSuave}>
                  Categoria com mais pontos de coleta cadastrados na sua região.
                </Texto>
              </View>

              <Icone nome="arrow-right" cor={categoriaDestaque.cor} />
            </Pressionavel>
          </Secao>
        </Animated.View>
      ) : null}

      {/* ============================================ */}
      {/* FILTRO POR CATEGORIA                          */}
      {/* ============================================ */}
      <Secao titulo="Filtrar por categoria" sangrar>
        <FiltroCategorias
          selecionada={categoriaSelecionada}
          aoSelecionar={setCategoriaSelecionada}
        />
      </Secao>

      {/* ============================================ */}
      {/* PONTOS DE COLETA                              */}
      {/* ============================================ */}
      <Secao
        titulo="Pontos de coleta"
        acao={{ rotulo: 'Ver todos', onPress: () => router.push('/(abas)/lista') }}
      >
        {carregando ? <EstadoTela carregando /> : null}

        {erro && !carregando ? (
          <EstadoTela
            icone="wifi-off"
            mensagem={erro}
            acao={{ rotulo: 'Tentar novamente', onPress: recarregar }}
          />
        ) : null}

        {!carregando && !erro && pontos.length === 0 ? (
          <EstadoTela
            icone="map-marker-off"
            mensagem={
              categoriaSelecionada === undefined
                ? 'Nenhum ponto cadastrado ainda.'
                : 'Nenhum ponto aceita esta categoria ainda.'
            }
            acao={{
              rotulo: 'Cadastrar primeiro ponto',
              onPress: () => router.push('/ponto/novo'),
            }}
          />
        ) : null}

        {!carregando && !erro
          ? pontos.slice(0, 5).map(ponto => (
              <CartaoPonto
                key={ponto.id}
                nome={ponto.nome}
                fotoUrl={ponto.fotoUrl}
                linhas={[ponto.bairro]}
                destaque={ponto.horarioFuncionamento}
                iconeDestaque="clock-outline"
                distancia={distanciaAte(ponto)}
                onPress={() => router.push(`/ponto/${ponto.id}`)}
              />
            ))
          : null}
      </Secao>
    </ScrollView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    gap: espaco.xl,
    paddingBottom: espaco.xxxl,
  },
  centro: {
    textAlign: 'center',
  },

  // ------------------ DESTAQUE ------------------
  destaque: {
    backgroundColor: cores.floresta,
    paddingHorizontal: espaco.xl,
    // Espaco para a visao geral subir por cima do destaque.
    paddingBottom: espaco.xxxl + espaco.xl,
    borderBottomLeftRadius: raios.lg,
    borderBottomRightRadius: raios.lg,
    overflow: 'hidden',
  },
  destaqueTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frase: {
    marginTop: espaco.xl,
  },
  subFrase: {
    marginTop: espaco.xs,
    // Deixa as folhas do canto direito respirarem.
    maxWidth: '72%',
  },

  // ------------------ VISAO GERAL ------------------
  visaoGeral: {
    flexDirection: 'row',
    gap: espaco.xs,
    marginHorizontal: espaco.xl,
    // Sobe por cima do destaque, descontando o gap da pagina.
    marginTop: -(espaco.xxxl + espaco.xl + espaco.md),
    padding: espaco.xs,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.alta,
  },
  numero: {
    flex: 1,
    alignItems: 'center',
    gap: espaco.xxs / 2,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.xxs,
    borderRadius: raios.md,
  },

  // ------------------ ACOES RAPIDAS ------------------
  atalhos: {
    flexDirection: 'row',
    gap: espaco.xs,
  },
  atalho: {
    flex: 1,
    alignItems: 'flex-start',
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raios.md,
    borderBottomLeftRadius: raios.sm / 2,
  },

  // ------------------ CATEGORIA EM DESTAQUE ------------------
  categoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raios.lg,
  },
  categoriaIcone: {
    width: tamanhos.toque + espaco.lg,
    height: tamanhos.toque + espaco.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raios.md,
    borderBottomLeftRadius: raios.sm / 2,
  },
  categoriaInfo: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
});
