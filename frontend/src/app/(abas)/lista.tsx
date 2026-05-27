// ============================================================
// TELA: Lista de Pontos de Coleta - VERSAO REPAGINADA
// Rota: /(abas)/lista
//
// ESTRUTURA:
//   1. Header com LinearGradient verde + titulo + contador
//   2. Barra de busca elevada (sobrepondo o header)
//   3. Filtro por categoria (chips horizontais com icone)
//   4. Indicador de filtro ativo (chip "limpar tudo")
//   5. Lista (FlatList) de cards refinados:
//        - Icone + info + badges das categorias do ponto
//   6. Estados especiais:
//        - Loading (spinner)
//        - Erro de rede (mensagem + botao tentar novamente)
//        - Sem pontos no back
//        - Sem resultados para busca (mensagem contextual)
//   7. FAB (botao flutuante) para adicionar ponto novo
// ============================================================

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORIAS } from "@/constantes/categorias";
import {
  Bordas,
  Cores,
  Espacamento,
  Fontes,
  Gradientes,
  Sombra,
} from "@/constantes/tema";
import { usePontos } from "@/hooks/usePontos";
import { Ponto } from "@/tipos/ponto";

// ============================================================
// SUBCOMPONENTE: Badge de categoria
// Pequena pilula colorida com o nome da categoria.
// ============================================================
function BadgeCategoria({ nome }: { nome: string }) {
  // Busca a cor da categoria via CATEGORIAS (match por nome, case-insensitive).
  // Se nao achar, usa cinza neutro. Isso evita crash quando o back
  // adiciona categoria nova sem ainda existir no front.
  const cor =
    CATEGORIAS.find((c) => c.nome.toLowerCase() === nome.toLowerCase())?.cor ??
    Cores.cinzaMedio;

  return (
    <View style={[estilos.badge, { backgroundColor: cor + "1A" }]}>
      <View style={[estilos.badgePonto, { backgroundColor: cor }]} />
      <Text style={[estilos.badgeTexto, { color: cor }]}>{nome}</Text>
    </View>
  );
}

// ============================================================
// SUBCOMPONENTE: Card de ponto
// ============================================================
function CardPonto({ ponto }: { ponto: Ponto }) {
  // Limita a 3 badges para nao quebrar layout em pontos com muitas categorias.
  // O "+N" indica quantas ainda existem.
  const categoriasVisiveis = ponto.categorias?.slice(0, 3) ?? [];
  const restantes = (ponto.categorias?.length ?? 0) - categoriasVisiveis.length;

  return (
    <TouchableOpacity
      style={estilos.card}
      onPress={() => router.push(`/ponto/${ponto.id}`)}
      activeOpacity={0.85}
    >
      {/* Coluna esquerda: icone do marcador */}
      <View style={estilos.cardIcone}>
        <MaterialCommunityIcons
          name="map-marker"
          size={24}
          color={Cores.primaria}
        />
      </View>

      {/* Coluna central: nome, endereco, bairro, horario, badges */}
      <View style={estilos.cardInfo}>
        <Text style={estilos.cardNome} numberOfLines={1}>
          {ponto.nome}
        </Text>

        <Text style={estilos.cardEndereco} numberOfLines={1}>
          {ponto.endereco}
        </Text>

        <Text style={estilos.cardBairro} numberOfLines={1}>
          {ponto.bairro}
        </Text>

        {/* Horario - icone separado do texto (evita Icon dentro de Text) */}
        {ponto.horarioFuncionamento ? (
          <View style={estilos.cardHorarioLinha}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color={Cores.secundaria}
            />
            <Text style={estilos.cardHorarioTexto} numberOfLines={1}>
              {ponto.horarioFuncionamento}
            </Text>
          </View>
        ) : null}

        {/* Badges de categoria */}
        {categoriasVisiveis.length > 0 ? (
          <View style={estilos.cardBadges}>
            {categoriasVisiveis.map((cat) => (
              <BadgeCategoria key={cat.id} nome={cat.nome} />
            ))}
            {restantes > 0 ? (
              <View
                style={[estilos.badge, { backgroundColor: Cores.cinzaBorda }]}
              >
                <Text
                  style={[estilos.badgeTexto, { color: Cores.cinzaEscuro }]}
                >
                  +{restantes}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Chevron a direita */}
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
export default function TelaLista() {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoria] = useState<number | undefined>(
    undefined,
  );
  const { pontos, carregando, erro, recarregar } =
    usePontos(categoriaSelecionada);

  // Filtra localmente por busca (nome ou bairro).
  const pontosFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return pontos;
    }

    const termo = busca.toLowerCase();
    return pontos.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.bairro.toLowerCase().includes(termo),
    );
  }, [pontos, busca]);

  // Helper para determinar qual estado vazio mostrar
  // (lista vazia do back vs busca sem match).
  const buscaAtiva =
    busca.trim().length > 0 || categoriaSelecionada !== undefined;

  return (
    <View style={estilos.raiz}>
      {/* ========================================== */}
      {/* HEADER COM GRADIENTE                       */}
      {/* ========================================== */}
      <LinearGradient
        colors={Gradientes.verde}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.header}
      >
        <Text style={estilos.headerTitulo}>Pontos de Coleta</Text>
        <Text style={estilos.headerSub}>
          {pontosFiltrados.length}{" "}
          {pontosFiltrados.length === 1 ? "ponto" : "pontos"} disponiveis
        </Text>
        {/* Espaco para a busca sobrepor */}
        <View style={{ height: 24 }} />
      </LinearGradient>

      {/* ========================================== */}
      {/* BUSCA elevada (sobrepoe o header)          */}
      {/* ========================================== */}
      <View style={estilos.buscaContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={Cores.cinzaMedio}
          style={estilos.buscaIcone}
        />
        <TextInput
          style={estilos.buscaInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome ou bairro..."
          placeholderTextColor={Cores.cinzaMedio}
          // clearButtonMode so funciona no iOS; no Android usamos o botao manual.
          clearButtonMode="while-editing"
        />
        {busca.length > 0 ? (
          <TouchableOpacity onPress={() => setBusca("")} hitSlop={8}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={Cores.cinzaMedio}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ========================================== */}
      {/* FILTRO POR CATEGORIA (chips horizontais)  */}
      {/* ========================================== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.chips}
        contentContainerStyle={estilos.chipsConteudo}
      >
        {/* Chip "Todos" - limpa filtro de categoria */}
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
                size={14}
                color={ativo ? Cores.branco : cat.cor}
                style={estilos.chipIcone}
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

      {/* ========================================== */}
      {/* LIMPAR FILTROS (so aparece se ativo)       */}
      {/* ========================================== */}
      {buscaAtiva ? (
        <TouchableOpacity
          style={estilos.limparFiltros}
          onPress={() => {
            setBusca("");
            setCategoria(undefined);
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="filter-off"
            size={14}
            color={Cores.primaria}
          />
          <Text style={estilos.limparFiltrosTexto}>Limpar filtros</Text>
        </TouchableOpacity>
      ) : null}

      {/* ========================================== */}
      {/* CONTEUDO: loading / erro / vazio / lista   */}
      {/* ========================================== */}
      {carregando && (
        <View style={estilos.estado}>
          <ActivityIndicator color={Cores.primaria} size="large" />
          <Text style={estilos.estadoTexto}>Carregando pontos...</Text>
        </View>
      )}

      {erro && !carregando && (
        <View style={estilos.estado}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={48}
            color={Cores.cinzaMedio}
          />
          <Text style={estilos.estadoTitulo}>Erro de conexao</Text>
          <Text style={estilos.estadoTexto}>{erro}</Text>
          <TouchableOpacity style={estilos.btnTentar} onPress={recarregar}>
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={Cores.primaria}
            />
            <Text style={estilos.btnTentarTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!carregando && !erro && pontosFiltrados.length === 0 && (
        <View style={estilos.estado}>
          <MaterialCommunityIcons
            name={buscaAtiva ? "magnify-close" : "map-marker-off"}
            size={48}
            color={Cores.cinzaMedio}
          />
          <Text style={estilos.estadoTitulo}>
            {buscaAtiva ? "Nenhum resultado" : "Sem pontos cadastrados"}
          </Text>
          <Text style={estilos.estadoTexto}>
            {buscaAtiva
              ? "Tente outra busca ou remova os filtros."
              : "Seja o primeiro a cadastrar um ponto de coleta!"}
          </Text>
          {buscaAtiva ? (
            <TouchableOpacity
              style={estilos.btnTentar}
              onPress={() => {
                setBusca("");
                setCategoria(undefined);
              }}
            >
              <Text style={estilos.btnTentarTexto}>Limpar filtros</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {!carregando && !erro && pontosFiltrados.length > 0 && (
        <FlatList
          data={pontosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CardPonto ponto={item} />}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ========================================== */}
      {/* FAB (Floating Action Button) com label     */}
      {/* ========================================== */}
      <TouchableOpacity
        style={estilos.fab}
        onPress={() => router.push("/ponto/novo")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={22} color={Cores.branco} />
        <Text style={estilos.fabLabel}>Novo ponto</Text>
      </TouchableOpacity>
    </View>
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

  // ------------ HEADER ------------
  header: {
    paddingTop: 56,
    paddingBottom: Espacamento.lg,
    paddingHorizontal: Espacamento.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitulo: {
    fontSize: Fontes.titulo,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.branco,
  },
  headerSub: {
    fontSize: Fontes.normal,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },

  // ------------ BUSCA ------------
  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Cores.branco,
    marginHorizontal: Espacamento.lg,
    marginTop: -24, // sobrepoe o espaco reservado no header
    borderRadius: Bordas.raio,
    paddingHorizontal: Espacamento.sm,
    ...Sombra.padrao,
  },
  buscaIcone: {
    marginRight: Espacamento.xs,
  },
  buscaInput: {
    flex: 1,
    height: 48,
    fontSize: Fontes.normal,
    color: Cores.preto,
  },

  // ------------ CHIPS ------------
  chips: {
    marginTop: Espacamento.md,
    marginBottom: Espacamento.sm,
    maxHeight: 44, // limita altura do ScrollView horizontal
  },
  chipsConteudo: {
    paddingHorizontal: Espacamento.lg,
    gap: Espacamento.sm,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.md,
    paddingVertical: 6,
    backgroundColor: Cores.branco,
  },
  chipAtivo: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  chipIcone: {
    marginRight: 4,
  },
  chipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },
  chipTextoAtivo: {
    color: Cores.branco,
  },

  // ------------ LIMPAR FILTROS ------------
  limparFiltros: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.xs,
  },
  limparFiltrosTexto: {
    fontSize: Fontes.pequena,
    color: Cores.primaria,
    fontWeight: Fontes.medio_peso,
  },

  // ------------ LISTA ------------
  lista: {
    padding: Espacamento.lg,
    paddingBottom: 100, // espaco extra para o FAB nao cobrir ultimo item
    gap: Espacamento.sm,
  },

  // ------------ CARD ------------
  card: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.md,
    flexDirection: "row",
    alignItems: "flex-start",
    ...Sombra.suave,
  },
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.primariaFundo,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Espacamento.sm,
    marginTop: 2,
  },
  cardInfo: {
    flex: 1,
    gap: 1,
  },
  cardNome: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
  },
  cardEndereco: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaEscuro,
    marginTop: 2,
  },
  cardBairro: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
  },
  cardHorarioLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardHorarioTexto: {
    fontSize: Fontes.pequena,
    color: Cores.secundaria,
    fontWeight: Fontes.medio_peso,
  },
  cardBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: Espacamento.sm,
  },

  // ------------ BADGE ------------
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 3,
    borderRadius: Bordas.raioTotal,
    gap: 4,
  },
  badgePonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: Fontes.negrito,
  },

  // ------------ ESTADO ------------
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Espacamento.sm,
    padding: Espacamento.lg,
  },
  estadoTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.cinzaEscuro,
    marginTop: Espacamento.xs,
  },
  estadoTexto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    textAlign: "center",
  },
  btnTentar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm,
    backgroundColor: Cores.primariaFundo,
    borderRadius: Bordas.raioTotal,
    marginTop: Espacamento.sm,
  },
  btnTentarTexto: {
    fontSize: Fontes.normal,
    color: Cores.primaria,
    fontWeight: Fontes.negrito,
  },

  // ------------ FAB ------------
  fab: {
    position: "absolute",
    bottom: Espacamento.lg,
    right: Espacamento.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Espacamento.md,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raioTotal,
    backgroundColor: Cores.primaria,
    ...Sombra.forte,
  },
  fabLabel: {
    color: Cores.branco,
    fontSize: Fontes.normal,
    fontWeight: Fontes.muitoNegrito,
  },
});
