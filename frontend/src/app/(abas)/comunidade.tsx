// ============================================================
// TELA: Comunidade
// Rota: /(abas)/comunidade
//
// Mostra onde ja existem pontos de coleta e quem os cadastrou:
//   - Busca por cidade (com atalhos das cidades que ja tem pontos)
//   - Aba "Pessoas": nome + total de pontos -> abre o perfil da pessoa
//   - Aba "Pontos": pontos de todas as pessoas -> abre o mapa no ponto
// ============================================================

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { Avatar } from "@/componentes/Avatar";
import { CabecalhoTela } from "@/componentes/CabecalhoTela";
import { CampoBusca } from "@/componentes/CampoBusca";
import { CartaoPonto } from "@/componentes/CartaoPonto";
import { Chip } from "@/componentes/Chip";
import { EstadoTela } from "@/componentes/EstadoTela";
import { Icone } from "@/componentes/Icone";
import { Pressionavel } from "@/componentes/Pressionavel";
import { Texto } from "@/componentes/Texto";
import { cores, espaco, raios, sombras, tamanhos } from "@/constantes/tema";
import {
  listarCidades,
  listarPessoas,
  listarPontosDaComunidade,
} from "@/servicos/comunidade";
import { CidadeComunidade, PessoaComunidade } from "@/tipos/comunidade";
import { Ponto } from "@/tipos/ponto";

type Aba = "pessoas" | "pontos";

// Espera o usuario parar de digitar antes de consultar a API.
const ATRASO_BUSCA_MS = 400;

function rotuloPontos(total: number): string {
  return `${total} ${total === 1 ? "ponto" : "pontos"}`;
}

function CartaoPessoa({ pessoa }: { pessoa: PessoaComunidade }) {
  return (
    <Pressionavel
      style={estilos.cartao}
      escala={0.98}
      onPress={() =>
        router.push({ pathname: "/pessoa/[id]", params: { id: String(pessoa.id) } })
      }
    >
      <Avatar nome={pessoa.nome} />
      <View style={estilos.cartaoInfo}>
        <Texto variante="cartao" numberOfLines={1}>
          {pessoa.nome}
        </Texto>
        <Texto variante="detalhe" cor={cores.primaria}>
          {rotuloPontos(pessoa.totalPontos)}{" "}
          {pessoa.totalPontos === 1 ? "cadastrado" : "cadastrados"}
        </Texto>
      </View>
      <Icone nome="chevron-right" cor={cores.tintaFraca} />
    </Pressionavel>
  );
}

// Abre a aba Mapa centralizada no ponto. "foco" muda a cada toque para
// que o mapa volte a centralizar mesmo se o ponto for o mesmo de antes.
function verNoMapa(ponto: Ponto) {
  router.push({
    pathname: "/(abas)/mapa",
    params: { pontoId: String(ponto.id), foco: String(Date.now()) },
  });
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
      <CabecalhoTela
        titulo="Comunidade"
        subtitulo="Veja onde já existem pontos de coleta e quem os cadastrou"
      >
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por cidade..."
          icone="city-variant-outline"
        />
      </CabecalhoTela>

      {/* Atalhos: cidades que ja tem ponto de coleta */}
      {cidades.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.cidades}
          contentContainerStyle={estilos.cidadesConteudo}
        >
          {cidades.map((item) => {
            const ativo = item.cidade.toLowerCase() === cidade.toLowerCase();
            return (
              <Chip
                key={item.cidade}
                rotulo={`${item.cidade} · ${item.totalPontos}`}
                ativo={ativo}
                onPress={() => setBusca(ativo ? "" : item.cidade)}
              />
            );
          })}
        </ScrollView>
      ) : null}

      {/* Alternador Pessoas / Pontos */}
      <View style={estilos.abas}>
        {(["pessoas", "pontos"] as const).map((opcao) => {
          const ativa = aba === opcao;
          const total = opcao === "pessoas" ? pessoas.length : pontos.length;
          const corConteudo = ativa ? cores.sobreEscuro : cores.tintaSuave;
          return (
            <Pressionavel
              key={opcao}
              style={[estilos.aba, ativa && estilos.abaAtiva]}
              onPress={() => setAba(opcao)}
              role="tab"
              aria-selected={ativa}
            >
              <Icone
                nome={opcao === "pessoas" ? "account-group" : "map-marker-multiple"}
                tamanho={tamanhos.iconeMenor}
                cor={corConteudo}
              />
              <Texto variante="corpoForte" cor={corConteudo}>
                {opcao === "pessoas" ? "Pessoas" : "Pontos"}
                {carregando ? "" : ` (${total})`}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>

      {carregando ? (
        <EstadoTela preencher carregando mensagem="Carregando comunidade..." />
      ) : null}

      {erro && !carregando ? (
        <EstadoTela
          preencher
          icone="wifi-off"
          titulo="Erro de conexão"
          mensagem={erro}
          acao={{ rotulo: "Tentar novamente", icone: "refresh", onPress: carregar }}
        />
      ) : null}

      {!carregando && !erro && totalItens === 0 ? (
        <EstadoTela
          preencher
          icone={filtrando ? "map-search-outline" : "account-group-outline"}
          titulo={
            filtrando
              ? `Nenhum ponto em "${cidade}"`
              : "Ainda não há pontos cadastrados"
          }
          mensagem={
            filtrando
              ? "Confira o nome da cidade ou seja o primeiro a cadastrar um ponto lá."
              : "Seja o primeiro a cadastrar um ponto de coleta!"
          }
          acao={{
            rotulo: "Cadastrar ponto",
            icone: "plus",
            onPress: () => router.push("/ponto/novo"),
          }}
        />
      ) : null}

      {!carregando && !erro && totalItens > 0 && aba === "pessoas" ? (
        <FlatList
          data={pessoas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CartaoPessoa pessoa={item} />}
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
          renderItem={({ item }) => (
            <CartaoPonto
              nome={item.nome}
              fotoUrl={item.fotoUrl}
              linhas={[[item.bairro, item.cidade].filter(Boolean).join(" · ")]}
              destaque={
                item.usuarioNome ? `Cadastrado por ${item.usuarioNome}` : null
              }
              iconeDestaque="account-outline"
              acao={<Icone nome="map-search-outline" cor={cores.tintaFraca} />}
              onPress={() => verNoMapa(item)}
            />
          )}
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
    backgroundColor: cores.fundo,
  },

  // ------------ CHIPS DE CIDADE ------------
  // Sem flexGrow/flexShrink 0, a lista abaixo (flex: 1) espreme a faixa.
  cidades: {
    marginTop: espaco.md,
    flexGrow: 0,
    flexShrink: 0,
  },
  cidadesConteudo: {
    paddingHorizontal: espaco.xl,
    gap: espaco.xs,
    alignItems: "center",
  },

  // ------------ ALTERNADOR ------------
  abas: {
    flexDirection: "row",
    gap: espaco.xxs,
    marginHorizontal: espaco.xl,
    marginTop: espaco.md,
    padding: espaco.xxs,
    borderRadius: raios.total,
    backgroundColor: cores.nevoa,
  },
  aba: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.xs,
    minHeight: tamanhos.toque,
    borderRadius: raios.total,
  },
  abaAtiva: {
    backgroundColor: cores.primaria,
  },

  // ------------ LISTA E CARTAO DE PESSOA ------------
  lista: {
    gap: espaco.sm,
    padding: espaco.xl,
    paddingTop: espaco.md,
  },
  cartao: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raios.lg,
    backgroundColor: cores.superficie,
    ...sombras.baixa,
  },
  cartaoInfo: {
    flex: 1,
    gap: espaco.xxs / 2,
  },
});
