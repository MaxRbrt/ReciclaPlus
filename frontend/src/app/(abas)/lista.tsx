// ============================================================
// TELA: Lista de Pontos de Coleta
// Rota: /(abas)/lista
//
// ESTRUTURA:
//   1. Cabecalho com titulo, contador e busca por nome, bairro ou cidade
//   2. Filtro por categoria (chips horizontais)
//   3. Atalho "Limpar filtros" quando ha busca ou categoria ativa
//   4. Lista de cards: foto, endereco, distancia e categorias do ponto,
//      do mais perto para o mais longe quando a posicao e conhecida
//   5. Estados: carregando, erro de rede, sem pontos, sem resultados
//   6. Botao flutuante para cadastrar ponto
// ============================================================

import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Botao } from "@/componentes/Botao";
import { BotaoFlutuante } from "@/componentes/BotaoFlutuante";
import { CabecalhoTela } from "@/componentes/CabecalhoTela";
import { CampoBusca } from "@/componentes/CampoBusca";
import { CartaoPonto } from "@/componentes/CartaoPonto";
import { EstadoTela } from "@/componentes/EstadoTela";
import { FiltroCategorias } from "@/componentes/FiltroCategorias";
import { cores, espaco, tamanhos } from "@/constantes/tema";
import { useLocalizacaoUsuario } from "@/hooks/useLocalizacaoUsuario";
import { usePontos } from "@/hooks/usePontos";
import {
  distanciaKm,
  formatarDistancia,
  normalizarTexto,
} from "@/servicos/localizacao";

export default function TelaLista() {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoria] = useState<number | undefined>(
    undefined,
  );
  const { pontos, carregando, erro, recarregar, atualizando, atualizar } =
    usePontos(categoriaSelecionada);
  const { posicao } = useLocalizacaoUsuario();

  // Filtra localmente por busca (nome, bairro ou cidade) e, quando a posicao
  // do usuario e conhecida, ordena do mais perto para o mais longe.
  const pontosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);
    const filtrados = termo
      ? pontos.filter((p) =>
          [p.nome, p.bairro, p.cidade].some((campo) =>
            normalizarTexto(campo ?? "").includes(termo),
          ),
        )
      : pontos;

    if (!posicao) {
      return filtrados;
    }
    return [...filtrados].sort(
      (a, b) => distanciaKm(posicao, a) - distanciaKm(posicao, b),
    );
  }, [pontos, busca, posicao]);

  // Helper para determinar qual estado vazio mostrar
  // (lista vazia do back vs busca sem match).
  const buscaAtiva =
    busca.trim().length > 0 || categoriaSelecionada !== undefined;

  function limparFiltros() {
    setBusca("");
    setCategoria(undefined);
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoTela
        titulo="Pontos de Coleta"
        subtitulo={
          carregando
            ? "Carregando..."
            : `${pontosFiltrados.length} ${
                pontosFiltrados.length === 1
                  ? "ponto disponível"
                  : "pontos disponíveis"
              }`
        }
      >
        <CampoBusca
          valor={busca}
          aoMudar={setBusca}
          placeholder="Buscar por nome, bairro ou cidade..."
        />
      </CabecalhoTela>

      <FiltroCategorias
        selecionada={categoriaSelecionada}
        aoSelecionar={setCategoria}
        style={estilos.filtro}
      />

      {buscaAtiva ? (
        <Botao
          compacto
          variante="suave"
          icone="filter-off"
          rotulo="Limpar filtros"
          onPress={limparFiltros}
          style={estilos.limpar}
        />
      ) : null}

      {carregando ? (
        <EstadoTela preencher carregando mensagem="Carregando pontos..." />
      ) : null}

      {erro && !carregando ? (
        <EstadoTela
          preencher
          icone="wifi-off"
          titulo="Erro de conexão"
          mensagem={erro}
          acao={{ rotulo: "Tentar novamente", icone: "refresh", onPress: recarregar }}
        />
      ) : null}

      {!carregando && !erro && pontosFiltrados.length === 0 ? (
        <EstadoTela
          preencher
          icone={buscaAtiva ? "magnify-close" : "map-marker-off"}
          titulo={buscaAtiva ? "Nenhum resultado" : "Sem pontos cadastrados"}
          mensagem={
            buscaAtiva
              ? "Tente outra busca ou remova os filtros."
              : "Seja o primeiro a cadastrar um ponto de coleta!"
          }
          acao={
            buscaAtiva
              ? { rotulo: "Limpar filtros", onPress: limparFiltros }
              : undefined
          }
        />
      ) : null}

      {!carregando && !erro && pontosFiltrados.length > 0 ? (
        <FlatList
          data={pontosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CartaoPonto
              nome={item.nome}
              fotoUrl={item.fotoUrl}
              linhas={[
                item.endereco,
                [item.bairro, item.cidade].filter(Boolean).join(" · "),
              ]}
              destaque={item.horarioFuncionamento}
              iconeDestaque="clock-outline"
              categorias={item.categorias}
              distancia={
                posicao
                  ? formatarDistancia(distanciaKm(posicao, item))
                  : undefined
              }
              onPress={() => router.push(`/ponto/${item.id}`)}
            />
          )}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={atualizar}
        />
      ) : null}

      <BotaoFlutuante
        rotulo="Novo ponto"
        onPress={() => router.push("/ponto/novo")}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  filtro: {
    marginTop: espaco.md,
  },
  limpar: {
    alignSelf: "flex-start",
    marginTop: espaco.sm,
    marginLeft: espaco.xl,
  },
  lista: {
    gap: espaco.sm,
    padding: espaco.xl,
    paddingTop: espaco.md,
    // Folga para o botao flutuante nao cobrir o ultimo cartao.
    paddingBottom: tamanhos.botao + espaco.xxxl,
  },
});
