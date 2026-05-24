// ============================================================
// LAYOUT RAIZ — _layout.tsx
// Ponto de entrada da navegacao do app (Expo Router).
//
// RESPONSABILIDADES:
//   1. Montar os Providers globais (Autenticacao e Localizacao)
//      para que TODAS as telas tenham acesso a esses contextos.
//   2. Decidir, ao abrir o app, para onde mandar o usuario:
//        - Sem sessao salva  -> /(auth)/entrar (tela de login)
//        - Com sessao salva  -> /(abas)        (tab bar principal)
//   3. Declarar todos os grupos de rotas do app.
//
// Por que o gate fica AQUI e nao em cada tela:
//   - Evita "flash" da tela errada (ex: ver as abas por meio segundo
//     antes de ser jogado pro login).
//   - Centraliza a regra de protecao de rota em um unico ponto.
//
// O Stack nao mostra header proprio — cada grupo gerencia o seu.
// ============================================================

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AutenticacaoProvider } from '@/contextos/AutenticacaoContexto';
import { LocalizacaoProvider } from '@/contextos/LocalizacaoContexto';
import { useAutenticacao } from '@/hooks/useAutenticacao';

// ------------------------------------------------------------
// Componente: GuardaDeRotas
// Roda dentro do AutenticacaoProvider e observa o estado
// de autenticacao. Quando muda, redireciona para o grupo
// correto (auth vs abas).
// ------------------------------------------------------------
function GuardaDeRotas({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAutenticacao();
  const segmentos = useSegments() as string[]; // ex: ['(auth)', 'entrar'] ou ['(abas)']
  const router = useRouter();

  useEffect(() => {
    // Enquanto verifica AsyncStorage, nao mexe na navegacao
    if (carregando) return;

    // Detecta em qual grupo o usuario esta agora
    const dentroDoGrupoAuth = segmentos[0] === '(auth)';
    const dentroDoGrupoAbas = segmentos[0] === '(abas)';

    if (!usuario && !dentroDoGrupoAuth) {
      // Sem login e fora do grupo de auth -> joga para a tela de login
      router.replace('/(auth)/entrar');
    } else if (usuario && (dentroDoGrupoAuth || segmentos.length === 0)) {
      // Logado mas ainda na tela de auth (ou na raiz) -> manda pras abas
      router.replace('/(abas)');
    }
    // Demais combinacoes: mantem onde esta (ex: logado dentro de /ponto/123)
  }, [usuario, carregando, segmentos]);

  return <>{children}</>;
}

// ------------------------------------------------------------
// Layout raiz exportado pelo Expo Router
// ------------------------------------------------------------
export default function LayoutRaiz() {
  return (
    // Provider de autenticacao envolve TUDO — necessario para que
    // useAutenticacao() funcione em qualquer tela e no proprio guard.
    <AutenticacaoProvider>
      {/* Provider de localizacao tambem global — telas de mapa/lista
          dependem dele para mostrar pontos proximos. */}
      <LocalizacaoProvider>
        <GuardaDeRotas>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Tela inicial (splash) — decide redirect inicial */}
            <Stack.Screen name="index" />

            {/* Grupo de autenticacao — usuario nao logado ve essas telas */}
            <Stack.Screen name="(auth)" />

            {/* Grupo principal — usuario logado ve as abas */}
            <Stack.Screen name="(abas)" />

            {/* Telas de ponto ficam fora das abas (navegacao em cima) */}
            <Stack.Screen name="ponto" />
          </Stack>
        </GuardaDeRotas>
      </LocalizacaoProvider>
    </AutenticacaoProvider>
  );
}
