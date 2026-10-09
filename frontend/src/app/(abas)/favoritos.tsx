// ============================================================
// TELA: Favoritos
// Rota: /(abas)/favoritos
// ============================================================

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import {
  FavoritoPonto,
  listarFavoritos,
  removerFavorito,
} from "@/servicos/favoritos";
import { LinearGradient } from "expo-linear-gradient";
import {
  Cores,
  Fontes,
  Espacamento,
  Bordas,
  Gradientes,
  Sombra,
} from "@/constantes/tema";
import { alertar } from "@/servicos/alerta";
import { MiniaturaPonto } from "@/componentes/MiniaturaPonto";

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

  function renderItem({ item }: { item: FavoritoPonto }) {
    const removendoEste = removendo === item.favoritoId;
    return (
      <TouchableOpacity
        style={estilos.card}
        onPress={() => router.push(`/ponto/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={estilos.cardIcone}>
          <MiniaturaPonto
            fotoUrl={item.fotoUrl}
            tamanho={44}
            icone="heart"
            corIcone={Cores.erro}
          />
        </View>
        <View style={estilos.cardInfo}>
          <Text style={estilos.cardNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={estilos.cardEndereco} numberOfLines={1}>
            {item.endereco}
          </Text>
          <Text style={estilos.cardBairro} numberOfLines={1}>
            {[item.bairro, item.cidade].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <TouchableOpacity
          style={estilos.btnRemover}
          onPress={() => aoRemover(item.favoritoId, item.nome)}
          disabled={removendoEste}
        >
          {removendoEste ? (
            <ActivityIndicator size="small" color={Cores.erro} />
          ) : (
            <MaterialCommunityIcons
              name="heart-off-outline"
              size={22}
              color={Cores.erro}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={estilos.raiz}>
      {/* Header no mesmo padrao das abas Pontos e Comunidade */}
      <LinearGradient
        colors={Gradientes.verde}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.header}
      >
        <Text style={estilos.headerTitulo}>Favoritos</Text>
        <Text style={estilos.headerSub}>
          {carregando
            ? "Carregando..."
            : `${favoritos.length} ${
                favoritos.length === 1 ? "ponto salvo" : "pontos salvos"
              }`}
        </Text>
      </LinearGradient>

      {carregando && (
        <ActivityIndicator
          color={Cores.primaria}
          style={{ marginTop: Espacamento.xl }}
        />
      )}

      {!carregando && favoritos.length === 0 && (
        <View style={estilos.vazio}>
          <MaterialCommunityIcons
            name="heart-off-outline"
            size={64}
            color={Cores.cinzaBorda}
          />
          <Text style={estilos.vazioTitulo}>Nenhum favorito ainda</Text>
          <Text style={estilos.vazioSub}>
            Explore os pontos de coleta e salve os que preferir.
          </Text>
          <TouchableOpacity
            style={estilos.btnExplorar}
            onPress={() => router.push("/(abas)/lista")}
            activeOpacity={0.85}
          >
            <Text style={estilos.btnExplorarTexto}>Explorar pontos</Text>
          </TouchableOpacity>
        </View>
      )}

      {!carregando && favoritos.length > 0 && (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => String(item.favoritoId)}
          renderItem={renderItem}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={aoAtualizar}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: Cores.cinzaClaro,
  },

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

  lista: {
    padding: Espacamento.lg,
  },
  card: {
    backgroundColor: Cores.branco,
    borderRadius: Bordas.raio,
    padding: Espacamento.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Espacamento.sm,
    ...Sombra.suave,
  },
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Cores.erroFundo,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Espacamento.sm,
  },
  cardInfo: { flex: 1 },
  cardNome: {
    fontSize: Fontes.normal,
    fontWeight: Fontes.negrito,
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
    marginTop: 1,
  },
  btnRemover: {
    padding: Espacamento.sm,
  },

  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Espacamento.xl,
    gap: Espacamento.sm,
  },
  vazioTitulo: {
    fontSize: Fontes.grande,
    fontWeight: Fontes.negrito,
    color: Cores.cinzaEscuro,
    marginTop: Espacamento.sm,
  },
  vazioSub: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    textAlign: "center",
    lineHeight: 22,
  },
  btnExplorar: {
    marginTop: Espacamento.md,
    backgroundColor: Cores.primaria,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.xl,
    paddingVertical: Espacamento.sm,
  },
  btnExplorarTexto: {
    color: Cores.branco,
    fontWeight: Fontes.negrito,
    fontSize: Fontes.normal,
  },
});
