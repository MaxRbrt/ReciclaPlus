// ============================================================
// TELA: Splash inicial
// Rota: /
//
// FUNCAO:
//   Tela exibida no breve intervalo entre o app abrir
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

import { StyleSheet, View } from 'react-native';
import { EstadoTela } from '@/componentes/EstadoTela';
import { cores } from '@/constantes/tema';

export default function TelaInicial() {
  return (
    <View style={estilos.raiz}>
      <EstadoTela preencher carregando mensagem="Carregando Recicla+..." />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
});
