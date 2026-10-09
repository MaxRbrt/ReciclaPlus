// ============================================================
// TELA: Favoritos
// Rota: /(abas)/favoritos
// ============================================================

import { FlatList, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { BotaoIcone } from "@/componentes/BotaoIcone";
import { CabecalhoTela } from "@/componentes/CabecalhoTela";
import { CartaoPonto } from "@/componentes/CartaoPonto";
import { EstadoTela } from "@/componentes/EstadoTela";
import { cores, espaco } from "@/constantes/tema";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import {
  FavoritoPonto,
  listarFavoritos,
  removerFavorito,
} from "@/servicos/favoritos";
import { alertar } from "@/servicos/alerta";

export default function TelaFavoritos() {
  const { usuario } = useAutenticacao();
  const [favoritos, setFavoritos] = useState<FavoritoPonto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [removendo, setRemovendo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) {
      setFavoritos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const dados = await listarFavoritos();
      setFavoritos(dados);
    } catch {
      alertar("Erro", "Não foi possível carregar seus favoritos.");
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // "Puxar para atualizar": busca de novo sem esconder a lista atual.
  const [atualizando, setAtualizando] = useState(false);
  async function aoAtualizar() {
    setAtualizando(true);
    try {
      setFavoritos(await listarFavoritos());
    } catch {
      // Falhou: a lista que ja esta na tela continua valendo.
    } finally {
      setAtualizando(false);
    }
  }

  async function aoRemover(favoritoId: number, nomePonto: string) {
    alertar("Remover favorito", `Remover "${nomePonto}" dos favoritos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setRemovendo(favoritoId);
          try {
            await removerFavorito(favoritoId);
            setFavoritos((prev) =>
              prev.filter((f) => f.favoritoId !== favoritoId),
            );
          } catch {
            alertar("Erro", "Não foi possível remover o favorito.");
          } finally {
            setRemovendo(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={estilos.raiz}>
      <CabecalhoTela
        titulo="Favoritos"
        subtitulo={
          carregando
            ? "Carregando..."
            : `${favoritos.length} ${
                favoritos.length === 1 ? "ponto salvo" : "pontos salvos"
              }`
        }
      />

      {carregando ? <EstadoTela preencher carregando /> : null}

      {!carregando && favoritos.length === 0 ? (
        <EstadoTela
          preencher
          icone="heart-off-outline"
          titulo="Nenhum favorito ainda"
          mensagem="Explore os pontos de coleta e salve os que preferir."
          acao={{
            rotulo: "Explorar pontos",
            onPress: () => router.push("/(abas)/lista"),
          }}
        />
      ) : null}

      {!carregando && favoritos.length > 0 ? (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => String(item.favoritoId)}
          renderItem={({ item }) => (
            <CartaoPonto
              nome={item.nome}
              fotoUrl={item.fotoUrl}
              iconeMiniatura="heart"
              corMiniatura={cores.coracao}
              linhas={[
                item.endereco,
                [item.bairro, item.cidade].filter(Boolean).join(" · "),
              ]}
              onPress={() => router.push(`/ponto/${item.id}`)}
              acao={
                <BotaoIcone
                  icone="heart-off-outline"
                  rotulo={`Remover ${item.nome} dos favoritos`}
                  variante="simples"
                  cor={cores.erro}
                  carregando={removendo === item.favoritoId}
                  onPress={() => aoRemover(item.favoritoId, item.nome)}
                />
              }
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
  lista: {
    gap: espaco.sm,
    padding: espaco.xl,
  },
});
