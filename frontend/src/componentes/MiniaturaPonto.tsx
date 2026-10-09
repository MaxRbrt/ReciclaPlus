// Miniatura redonda usada nos cartoes de ponto: a foto do ponto quando
// existe e carrega; senao, um icone sobre fundo colorido.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Cores } from '@/constantes/tema';
import { montarUrlFoto } from '@/servicos/fotoPonto';

interface MiniaturaPontoProps {
  fotoUrl?: string | null;
  tamanho?: number;
  icone?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  corIcone?: string;
}

export function MiniaturaPonto({
  fotoUrl,
  tamanho = 44,
  icone = 'map-marker',
  corIcone = Cores.primaria,
}: MiniaturaPontoProps) {
  const uri = montarUrlFoto(fotoUrl);
  // Guarda a uri que falhou (ex.: foto antiga salva so no aparelho de quem
  // cadastrou); se a foto do ponto mudar, a nova e tentada normalmente.
  const [uriComErro, setUriComErro] = useState<string | null>(null);

  const formato = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (uri && uri !== uriComErro) {
    return (
      <Image
        source={{ uri }}
        style={[estilos.foto, formato]}
        onError={() => setUriComErro(uri)}
      />
    );
  }

  return (
    <View style={[estilos.semFoto, formato]}>
      <MaterialCommunityIcons name={icone} size={tamanho * 0.5} color={corIcone} />
    </View>
  );
}

const estilos = StyleSheet.create({
  foto: {
    backgroundColor: Cores.cinzaBorda,
  },
  semFoto: {
    backgroundColor: Cores.primariaFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
