// ============================================================
// LAYOUT DO GRUPO (abas)
// Define a tab bar inferior com 5 abas principais do app.
// So usuarios autenticados chegam aqui (controle via contexto).
// Cada aba tem icone e label em portugues.
// ============================================================

import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icone, NomeIcone } from "@/componentes/Icone";
import { cores, espaco, raios, tamanhos, tipografia } from "@/constantes/tema";

// Icone da aba: cheio sobre uma pilula verde-clara quando ativa.
function IconeAba({
  nome,
  nomeAtivo,
  focado,
}: {
  nome: NomeIcone;
  nomeAtivo: NomeIcone;
  focado: boolean;
}) {
  return (
    <View style={[estilos.icone, focado && estilos.iconeAtivo]}>
      <Icone
        nome={focado ? nomeAtivo : nome}
        tamanho={tamanhos.iconeMaior - 2}
        cor={focado ? cores.primaria : cores.tintaFraca}
      />
    </View>
  );
}

const ABAS: { rota: string; titulo: string; nome: NomeIcone; nomeAtivo: NomeIcone }[] = [
  { rota: "index",      titulo: "Início",     nome: "home-variant-outline",          nomeAtivo: "home-variant" },
  { rota: "mapa",       titulo: "Mapa",       nome: "map-outline",                   nomeAtivo: "map" },
  { rota: "lista",      titulo: "Pontos",     nome: "map-marker-multiple-outline",   nomeAtivo: "map-marker-multiple" },
  { rota: "comunidade", titulo: "Comunidade", nome: "account-group-outline",         nomeAtivo: "account-group" },
  { rota: "favoritos",  titulo: "Favoritos",  nome: "heart-outline",                 nomeAtivo: "heart" },
];

export default function LayoutAbas() {
  const margens = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.tintaSuave,
        tabBarLabelStyle: estilos.rotulo,
        tabBarStyle: [
          estilos.barra,
          {
            height: tamanhos.barraAbas + margens.bottom,
            paddingBottom: margens.bottom,
          },
        ],
      }}
    >
      {ABAS.map((aba) => (
        <Tabs.Screen
          key={aba.rota}
          name={aba.rota}
          options={{
            title: aba.titulo,
            tabBarIcon: ({ focused }) => (
              <IconeAba nome={aba.nome} nomeAtivo={aba.nomeAtivo} focado={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const estilos = StyleSheet.create({
  // A altura e a folga inferior vem da area segura, calculadas no layout.
  barra: {
    backgroundColor: cores.superficie,
    borderTopWidth: 0,
    paddingTop: espaco.xs,
  },
  rotulo: {
    ...tipografia.aba,
    marginTop: espaco.xxs,
  },
  icone: {
    width: tamanhos.toque + espaco.xs,
    height: tamanhos.iconeMaior + espaco.xs,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raios.total,
  },
  iconeAtivo: {
    backgroundColor: cores.nevoa,
  },
});
