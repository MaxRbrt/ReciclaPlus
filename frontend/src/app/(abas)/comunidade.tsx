// ============================================================
// TELA: Comunidade
// Rota: /(abas)/comunidade
//
// Mostra onde ja existem pontos de coleta e quem os cadastrou:
//   - Busca por cidade (com atalhos das cidades que ja tem pontos)
//   - Aba "Pessoas": nome + total de pontos -> abre o perfil da pessoa
//   - Aba "Pontos": pontos de todas as pessoas -> abre o mapa no ponto
// ============================================================

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import {
  Bordas,
  Cores,
  Espacamento,
  Fontes,
  Gradientes,
  Sombra,
} from "@/constantes/tema";
import {
  listarCidades,
  listarPessoas,
  listarPontosDaComunidade,
} from "@/servicos/comunidade";
import { MiniaturaPonto } from "@/componentes/MiniaturaPonto";
import { CidadeComunidade, PessoaComunidade } from "@/tipos/comunidade";
import { Ponto } from "@/tipos/ponto";

type Aba = "pessoas" | "pontos";

// Espera o usuario parar de digitar antes de consultar a API.
const ATRASO_BUSCA_MS = 400;

function rotuloPontos(total: number): string {
  return `${total} ${total === 1 ? "ponto" : "pontos"}`;
}

function CardPessoa({ pessoa }: { pessoa: PessoaComunidade }) {
  return (
    <TouchableOpacity
      style={estilos.card}
      onPress={() =>
        router.push({ pathname: "/pessoa/[id]", params: { id: String(pessoa.id) } })
      }
      activeOpacity={0.85}
    >
      <View style={estilos.avatar}>
        <Text style={estilos.avatarTexto}>
          {pessoa.nome.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={estilos.cardInfo}>
        <Text style={estilos.cardTitulo} numberOfLines={1}>
          {pessoa.nome}
        </Text>
        <Text style={estilos.cardDestaque}>
          {rotuloPontos(pessoa.totalPontos)}{" "}
          {pessoa.totalPontos === 1 ? "cadastrado" : "cadastrados"}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={Cores.cinzaMedio}
      />
    </TouchableOpacity>
  );
}

function CardPontoComunidade({ ponto }: { ponto: Ponto }) {
  // Abre a aba Mapa centralizada neste ponto. "foco" muda a cada toque para
  // que o mapa volte a centralizar mesmo se o ponto for o mesmo de antes.
  function verNoMapa() {
    router.push({
      pathname: "/(abas)/mapa",
      params: { pontoId: String(ponto.id), foco: String(Date.now()) },
    });
  }

  return (
    <TouchableOpacity
      style={estilos.card}
      onPress={verNoMapa}
      activeOpacity={0.85}
    >
      <View style={estilos.cardIcone}>
        <MiniaturaPonto fotoUrl={ponto.fotoUrl} tamanho={44} />
      </View>
      <View style={estilos.cardInfo}>
        <Text style={estilos.cardTitulo} numberOfLines={1}>
          {ponto.nome}
        </Text>
        <Text style={estilos.cardLinha} numberOfLines={1}>
          {[ponto.bairro, ponto.cidade].filter(Boolean).join(" · ")}
        </Text>
        {ponto.usuarioNome ? (
          <Text style={estilos.cardDestaque} numberOfLines={1}>
            Cadastrado por {ponto.usuarioNome}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name="map-search-outline"
        size={20}
        color={Cores.cinzaMedio}
      />
    </TouchableOpacity>
  );
}

export default function TelaComunidade() {
  // ?cidade=... : aberta pela tela inicial ja filtrada na cidade do usuario.
  const params = useLocalSearchParams<{ cidade?: string }>();

  const [aba, setAba] = useState<Aba>("pessoas");
  const [busca, setBusca] = useState(params.cidade ?? "");

  // Um novo pedido de cidade (voltar a tela inicial e tocar de novo) substitui
  // o que estava digitado.
  const [cidadePedida, setCidadePedida] = useState(params.cidade);
  if (params.cidade !== cidadePedida) {
    setCidadePedida(params.cidade);
    if (params.cidade) setBusca(params.cidade);
  }
  // Cidade realmente aplicada como filtro (a busca digitada, com atraso).
  const [cidade, setCidade] = useState((params.cidade ?? "").trim());

  const [cidades, setCidades] = useState<CidadeComunidade[]>([]);
  const [pessoas, setPessoas] = useState<PessoaComunidade[]>([]);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setCidade(busca.trim()), ATRASO_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [busca]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [listaCidades, listaPessoas, listaPontos] = await Promise.all([
        listarCidades(),
        listarPessoas(cidade),
        listarPontosDaComunidade(cidade),
      ]);
      setCidades(listaCidades);
      setPessoas(listaPessoas);
      setPontos(listaPontos);
    } catch {
      setErro("Não foi possível carregar a comunidade. Verifique sua conexão.");
    } finally {
      setCarregando(false);
    }
  }, [cidade]);

  // Recarrega ao abrir a aba e sempre que o filtro de cidade muda.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // "Puxar para atualizar": busca de novo sem esconder as listas atuais.
  const [atualizando, setAtualizando] = useState(false);
  async function aoAtualizar() {
    setAtualizando(true);
    try {
      const [listaCidades, listaPessoas, listaPontos] = await Promise.all([
        listarCidades(),
        listarPessoas(cidade),
        listarPontosDaComunidade(cidade),
      ]);
      setCidades(listaCidades);
      setPessoas(listaPessoas);
      setPontos(listaPontos);
    } catch {
      // Falhou: o que ja esta na tela continua valendo.
    } finally {
      setAtualizando(false);
    }
  }

  const filtrando = cidade.length > 0;
  const totalItens = aba === "pessoas" ? pessoas.length : pontos.length;

  return (
    <View style={estilos.raiz}>
      <LinearGradient
        colors={Gradientes.verde}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.header}
      >
        <Text style={estilos.headerTitulo}>Comunidade</Text>
        <Text style={estilos.headerSub}>
          Veja onde já existem pontos de coleta e quem os cadastrou
        </Text>
        {/* Espaco para a busca sobrepor */}
        <View style={{ height: 24 }} />
      </LinearGradient>

      <View style={estilos.buscaContainer}>
        <MaterialCommunityIcons
          name="city-variant-outline"
          size={20}
          color={Cores.cinzaMedio}
          style={estilos.buscaIcone}
        />
        <TextInput
          style={estilos.buscaInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por cidade..."
          placeholderTextColor={Cores.cinzaMedio}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {busca.length > 0 ? (
          <TouchableOpacity
            onPress={() => setBusca("")}
            hitSlop={8}
            accessibilityLabel="Limpar busca"
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={Cores.cinzaMedio}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Atalhos: cidades que ja tem ponto de coleta */}
      {cidades.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.chips}
          contentContainerStyle={estilos.chipsConteudo}
        >
          {cidades.map((item) => {
            const ativo = item.cidade.toLowerCase() === cidade.toLowerCase();
            return (
              <TouchableOpacity
                key={item.cidade}
                style={[estilos.chip, ativo && estilos.chipAtivo]}
                onPress={() => setBusca(ativo ? "" : item.cidade)}
                activeOpacity={0.85}
              >
                <Text
                  style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}
                >
                  {item.cidade} · {item.totalPontos}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Alternador Pessoas / Pontos */}
      <View style={estilos.abas}>
        {(["pessoas", "pontos"] as const).map((opcao) => {
          const ativa = aba === opcao;
          const total = opcao === "pessoas" ? pessoas.length : pontos.length;
          return (
            <TouchableOpacity
              key={opcao}
              style={[estilos.aba, ativa && estilos.abaAtiva]}
              onPress={() => setAba(opcao)}
              activeOpacity={0.85}
              role="tab"
              aria-selected={ativa}
            >
              <MaterialCommunityIcons
                name={opcao === "pessoas" ? "account-group" : "map-marker-multiple"}
                size={16}
                color={ativa ? Cores.branco : Cores.cinzaEscuro}
              />
              <Text style={[estilos.abaTexto, ativa && estilos.abaTextoAtiva]}>
                {opcao === "pessoas" ? "Pessoas" : "Pontos"}
                {carregando ? "" : ` (${total})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {carregando ? (
        <View style={estilos.estado}>
          <ActivityIndicator color={Cores.primaria} size="large" />
          <Text style={estilos.estadoTexto}>Carregando comunidade...</Text>
        </View>
      ) : null}

      {erro && !carregando ? (
        <View style={estilos.estado}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={48}
            color={Cores.cinzaMedio}
          />
          <Text style={estilos.estadoTitulo}>Erro de conexão</Text>
          <Text style={estilos.estadoTexto}>{erro}</Text>
          <TouchableOpacity style={estilos.btnTentar} onPress={carregar}>
            <MaterialCommunityIcons
              name="refresh"
              size={16}
              color={Cores.primaria}
            />
            <Text style={estilos.btnTentarTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!carregando && !erro && totalItens === 0 ? (
        <View style={estilos.estado}>
          <MaterialCommunityIcons
            name={filtrando ? "map-search-outline" : "account-group-outline"}
            size={48}
            color={Cores.cinzaMedio}
          />
          <Text style={estilos.estadoTitulo}>
            {filtrando
              ? `Nenhum ponto em "${cidade}"`
              : "Ainda não há pontos cadastrados"}
          </Text>
          <Text style={estilos.estadoTexto}>
            {filtrando
              ? "Confira o nome da cidade ou seja o primeiro a cadastrar um ponto lá."
              : "Seja o primeiro a cadastrar um ponto de coleta!"}
          </Text>
          <TouchableOpacity
            style={estilos.btnTentar}
            onPress={() => router.push("/ponto/novo")}
          >
            <MaterialCommunityIcons name="plus" size={16} color={Cores.primaria} />
            <Text style={estilos.btnTentarTexto}>Cadastrar ponto</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!carregando && !erro && totalItens > 0 && aba === "pessoas" ? (
        <FlatList
          data={pessoas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CardPessoa pessoa={item} />}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={aoAtualizar}
        />
      ) : null}

      {!carregando && !erro && totalItens > 0 && aba === "pontos" ? (
        <FlatList
          data={pontos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CardPontoComunidade ponto={item} />}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={aoAtualizar}
        />
      ) : null}
    </View>
  );
}

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

  // ------------ CHIPS DE CIDADE ------------
  chips: {
    marginTop: Espacamento.md,
    maxHeight: 44,
    // Sem isto a lista abaixo (flex: 1) espreme a faixa e corta os chips.
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsConteudo: {
    paddingHorizontal: Espacamento.lg,
    gap: Espacamento.sm,
    alignItems: "center",
  },
  chip: {
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
  chipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },
  chipTextoAtivo: {
    color: Cores.branco,
  },

  // ------------ ALTERNADOR ------------
  abas: {
    flexDirection: "row",
    gap: Espacamento.sm,
    marginHorizontal: Espacamento.lg,
    marginTop: Espacamento.md,
  },
  aba: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Espacamento.sm + 2,
    borderRadius: Bordas.raio,
    backgroundColor: Cores.branco,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
  },
  abaAtiva: {
    backgroundColor: Cores.primaria,
    borderColor: Cores.primaria,
  },
  abaTexto: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
    color: Cores.cinzaEscuro,
  },
  abaTextoAtiva: {
    color: Cores.branco,
  },

  // ------------ LISTA E CARDS ------------
  lista: {
    padding: Espacamento.lg,
    gap: Espacamento.sm,
  },
  card: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raioGrande,
    padding: Espacamento.md,
    flexDirection: "row",
    alignItems: "center",
    ...Sombra.suave,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.primaria,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Espacamento.sm,
  },
  avatarTexto: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.branco,
  },
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.primariaFundo,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Espacamento.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
    marginRight: Espacamento.sm,
  },
  cardTitulo: {
    fontSize: Fontes.media,
    fontWeight: Fontes.muitoNegrito,
    color: Cores.preto,
  },
  cardLinha: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaEscuro,
  },
  cardDestaque: {
    fontSize: Fontes.pequena,
    color: Cores.secundaria,
    fontWeight: Fontes.medio_peso,
  },

  // ------------ ESTADOS ------------
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
    textAlign: "center",
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
});
