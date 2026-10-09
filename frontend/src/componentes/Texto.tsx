import { Text, TextProps } from 'react-native';
import { cores, tipografia } from '@/constantes/tema';

interface TextoProps extends TextProps {
  variante?: keyof typeof tipografia;
  cor?: string;
}

// Todo texto do app passa por aqui: a variante define familia e tamanho.
export function Texto({
  variante = 'corpo',
  cor = cores.tinta,
  style,
  ...resto
}: TextoProps) {
  return <Text style={[tipografia[variante], { color: cor }, style]} {...resto} />;
}
