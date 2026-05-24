// ============================================================
// LAYOUT DO GRUPO "ponto"
//
// MOTIVO DE EXISTIR:
//   O _layout.tsx raiz declara <Stack.Screen name="ponto" />,
//   que diz ao Expo Router: "trate 'ponto' como UM grupo de
//   navegacao". Sem este arquivo, o roteador nao encontra um
//   layout para o grupo e emite o warning:
//     "No route named 'ponto' exists in nested children"
//
//   Este Stack interno serve apenas como container para as
//   telas:
//     - /ponto/novo
//     - /ponto/[id]
//     - /ponto/editar/[id]
//
//   Nenhum header proprio — cada tela cuida do seu visual.
// ============================================================

import { Stack } from 'expo-router';

export default function LayoutPonto() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Cadastro de novo ponto */}
      <Stack.Screen name="novo" />

      {/* Detalhe de um ponto especifico — id dinamico */}
      <Stack.Screen name="[id]" />

      {/* Edicao de um ponto especifico; fica em /ponto/editar/:id */}
      <Stack.Screen name="editar/[id]" />
    </Stack>
  );
}
