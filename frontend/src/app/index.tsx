// ============================================================
// TELA: Splash inicial
// Rota: /
//
// FUNCAO:
//   Tela exibida pelo split de meio segundo entre o app abrir
//   e o GuardaDeRotas (em _layout.tsx) decidir para onde
//   redirecionar (login ou abas).
//
//   Sem essa tela, o Expo Router nao tem rota para "/" e mostra
//   uma tela de "Unmatched Route" antes do redirect acontecer.
//
//   O redirect efetivo NAO acontece aqui — quem cuida disso e o
//   GuardaDeRotas no _layout.tsx, que observa o contexto de
//   autenticacao. Esta tela apenas mostra um spinner enquanto
//   isso ocorre.
// ============================================================

import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Cores, Fontes, Espacamento } from '@/constantes/tema';

export default function TelaInicial() {
  return (
    <View style={estilos.raiz}>
      {/* Spinner verde + texto, combinando com a identidade do app */}
      <ActivityIndicator size="large" color={Cores.primaria} />
      <Text style={estilos.texto}>Carregando Recicla+...</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: Cores.cinzaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.md,
  },
  texto: {
    fontSize: Fontes.normal,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.medio_peso,
  },
});
