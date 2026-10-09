// Bloco de tela com titulo e, a direita, um complemento ou uma acao.

import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { cores, espaco } from '@/constantes/tema';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

interface SecaoProps {
  titulo: string;
  complemento?: string;
  acao?: { rotulo: string; onPress: () => void };
  // O conteudo vai de borda a borda (ex.: faixa de chips com rolagem).
  sangrar?: boolean;
  children: ReactNode;
}

export function Secao({ titulo, complemento, acao, sangrar = false, children }: SecaoProps) {
  return (
    <View style={estilos.secao}>
      <View style={estilos.cabecalho}>
        <Texto variante="subtitulo" style={estilos.titulo}>
          {titulo}
        </Texto>
        {acao ? (
          <Pressionavel onPress={acao.onPress} accessibilityRole="button" hitSlop={12}>
            <Texto variante="corpoForte" cor={cores.primaria}>
              {acao.rotulo}
            </Texto>
          </Pressionavel>
        ) : complemento ? (
          <Texto variante="detalhe" cor={cores.tintaSuave}>
            {complemento}
          </Texto>
        ) : null}
      </View>

      <View style={[estilos.conteudo, !sangrar && estilos.comMargem]}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  secao: {
    gap: espaco.sm,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: espaco.sm,
    paddingHorizontal: espaco.xl,
  },
  titulo: {
    flexShrink: 1,
  },
  conteudo: {
    gap: espaco.xs,
  },
  comMargem: {
    paddingHorizontal: espaco.xl,
  },
});
