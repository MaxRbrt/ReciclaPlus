// Fundo decorativo de folhas e massas de cor. Fica atras do conteudo e nao
// recebe toque. Com "animado", o conjunto deriva devagar, num vaivem.

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FormaOrganica } from '@/constantes/formas';
import { espaco } from '@/constantes/tema';
import { DesenhoFormas } from './DesenhoFormas';

// Meio ciclo do vaivem. Longo de proposito: e ambiente, nao chama atencao.
const DURACAO_DERIVA_MS = 7000;

interface FundoOrganicoProps {
  formas: FormaOrganica[];
  animado?: boolean;
}

export function FundoOrganico({ formas, animado = false }: FundoOrganicoProps) {
  const deriva = useSharedValue(0);
  // Quem pede movimento reduzido no aparelho ve o fundo parado.
  const movimentoReduzido = useReducedMotion();

  useEffect(() => {
    if (!animado || movimentoReduzido) return;
    deriva.set(
      withRepeat(
        withTiming(1, {
          duration: DURACAO_DERIVA_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [animado, movimentoReduzido, deriva]);

  const estiloDeriva = useAnimatedStyle(() => ({
    transform: [
      { translateY: (deriva.get() - 0.5) * espaco.md },
      { rotate: `${(deriva.get() - 0.5) * 3}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.fundo, estiloDeriva]}
    >
      <DesenhoFormas formas={formas} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  // Maior que a area visivel, para a deriva nunca mostrar a borda do desenho.
  fundo: {
    position: 'absolute',
    top: -espaco.md,
    right: -espaco.md,
    bottom: -espaco.md,
    left: -espaco.md,
  },
});
