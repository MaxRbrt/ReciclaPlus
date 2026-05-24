// ============================================================
// LAYOUT DO GRUPO (abas)
// Define a tab bar inferior com 4 abas principais do app.
// So usuarios autenticados chegam aqui (controle via contexto).
// Cada aba tem icone e label em portugues.
// ============================================================

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Cores } from '@/constantes/tema';

// Tipo auxiliar para tipar o nome dos icones do Ionicons
type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

// Componente do icone da aba (ativo = cor primaria, inativo = cinza)
function IconeAba({ nome, focado }: { nome: NomeIcone; focado: boolean }) {
  return (
    <Ionicons
      name={nome}
      size={24}
      color={focado ? Cores.primaria : Cores.cinzaMedio}
    />
  );
}

export default function LayoutAbas() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Cores.primaria,
        tabBarInactiveTintColor: Cores.cinzaMedio,
        tabBarStyle: {
          backgroundColor: Cores.branco,
          borderTopColor: Cores.cinzaClaro,
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      {/* ABA 1: Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'home' : 'home-outline'} focado={focused} />
          ),
        }}
      />

      {/* ABA 2: Mapa */}
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'map' : 'map-outline'} focado={focused} />
          ),
        }}
      />

      {/* ABA 3: Lista */}
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Pontos',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'list' : 'list-outline'} focado={focused} />
          ),
        }}
      />

      {/* ABA 4: Favoritos */}
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ focused }) => (
            <IconeAba nome={focused ? 'heart' : 'heart-outline'} focado={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
