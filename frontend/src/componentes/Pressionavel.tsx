// Base de tudo que e tocavel: encolhe com mola ao toque.

import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { movimento } from '@/constantes/tema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

export interface PressionavelProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  // Quanto encolhe ao toque; 1 desliga o efeito (ex.: areas muito grandes).
  escala?: number;
}

export function Pressionavel({
  style,
  escala = movimento.escalaToque,
  disabled,
  onPressIn,
  onPressOut,
  ...resto
}: PressionavelProps) {
  const pressao = useSharedValue(0);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressao.get() * (1 - escala) }],
  }));

  return (
    <PressableAnimado
      disabled={disabled}
      onPressIn={evento => {
        pressao.set(withSpring(1, movimento.mola));
        onPressIn?.(evento);
      }}
      onPressOut={evento => {
        pressao.set(withSpring(0, movimento.mola));
        onPressOut?.(evento);
      }}
      style={[style, estiloAnimado, disabled && estilos.desabilitado]}
      {...resto}
    />
  );
}

const estilos = StyleSheet.create({
  desabilitado: {
    opacity: 0.5,
  },
});
