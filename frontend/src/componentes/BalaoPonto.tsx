// Conteudo do balao que abre ao tocar num marcador do mapa.

import { StyleSheet, View } from 'react-native';
import { cores, espaco } from '@/constantes/tema';
import { Texto } from './Texto';

// Largura fixa: o balao nativo se ajusta ao conteudo e ficaria estreito demais.
const LARGURA_BALAO = 200;

interface BalaoPontoProps {
  nome: string;
  linha?: string | null;
  horario?: string | null;
}

export function BalaoPonto({ nome, linha, horario }: BalaoPontoProps) {
  return (
    <View style={estilos.balao}>
      <Texto variante="cartao" numberOfLines={2}>
        {nome}
      </Texto>
      {linha ? (
        <Texto variante="detalhe" cor={cores.tintaSuave}>
          {linha}
        </Texto>
      ) : null}
      {horario ? (
        <Texto variante="detalhe" cor={cores.primaria}>
          {horario}
        </Texto>
      ) : null}
      <Texto variante="corpoForte" cor={cores.primaria} style={estilos.ver}>
        Toque para ver detalhes
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  balao: {
    width: LARGURA_BALAO,
    gap: espaco.xxs / 2,
    padding: espaco.xs,
  },
  ver: {
    marginTop: espaco.xxs,
  },
});
