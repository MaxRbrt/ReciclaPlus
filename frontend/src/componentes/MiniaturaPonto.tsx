// Miniatura em forma de folha usada nos cartoes de ponto: a foto do ponto
// quando existe e carrega; senao, um icone sobre fundo colorido.

import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { cores, raios, tamanhos } from '@/constantes/tema';
import { montarUrlFoto } from '@/servicos/fotoPonto';
import { Icone, NomeIcone } from './Icone';

interface MiniaturaPontoProps {
  fotoUrl?: string | null;
  tamanho?: number;
  icone?: NomeIcone;
  corIcone?: string;
  corFundo?: string;
}

export function MiniaturaPonto({
  fotoUrl,
  tamanho = tamanhos.miniatura,
  icone = 'map-marker',
  corIcone = cores.primaria,
  corFundo = cores.nevoa,
}: MiniaturaPontoProps) {
  const uri = montarUrlFoto(fotoUrl);
  // Guarda a uri que falhou (ex.: foto antiga salva so no aparelho de quem
  // cadastrou); se a foto do ponto mudar, a nova e tentada normalmente.
  const [uriComErro, setUriComErro] = useState<string | null>(null);

  const formato = { width: tamanho, height: tamanho };

  if (uri && uri !== uriComErro) {
    return (
      <Image
        source={{ uri }}
        style={[estilos.folha, estilos.foto, formato]}
        onError={() => setUriComErro(uri)}
      />
    );
  }

  return (
    <View style={[estilos.folha, estilos.semFoto, formato, { backgroundColor: corFundo }]}>
      <Icone nome={icone} tamanho={tamanho * 0.5} cor={corIcone} />
    </View>
  );
}

const estilos = StyleSheet.create({
  // Tres cantos redondos e um quase reto: a silhueta de folha do app.
  folha: {
    borderRadius: raios.md,
    borderBottomLeftRadius: raios.sm / 2,
  },
  foto: {
    backgroundColor: cores.borda,
  },
  semFoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
