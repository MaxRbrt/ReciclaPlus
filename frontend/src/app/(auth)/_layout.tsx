// ============================================================
// LAYOUT DO GRUPO (auth)
// Gerencia a navegacao entre as telas de autenticacao.
// Usa Stack simples sem header — as proprias telas definem
// seu visual (logo, titulo, formulario).
// ============================================================

import { Stack } from 'expo-router';

export default function LayoutAuth() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="entrar" />
      <Stack.Screen name="cadastrar" />
    </Stack>
  );
}
