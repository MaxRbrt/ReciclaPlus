import { StyleSheet, View } from 'react-native';
import { cores, raios, tamanhos } from '@/constantes/tema';
import { Texto } from './Texto';

// Inicial do nome sobre a silhueta de folha.
export function Avatar({ nome }: { nome: string }) {
  return (
    <View style={estilos.avatar}>
      <Texto variante="titulo">{nome.trim().charAt(0).toUpperCase()}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  avatar: {
    width: tamanhos.miniatura,
    height: tamanhos.miniatura,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raios.md,
    borderBottomLeftRadius: raios.sm / 2,
    backgroundColor: cores.lima,
  },
});
