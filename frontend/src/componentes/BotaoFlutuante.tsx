// Botao de acao flutuante, no canto inferior direito da tela.

import { StyleSheet } from 'react-native';
import { cores, espaco, raios, sombras, tamanhos } from '@/constantes/tema';
import { Icone, NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

interface BotaoFlutuanteProps {
  rotulo: string;
  onPress: () => void;
  icone?: NomeIcone;
}

export function BotaoFlutuante({ rotulo, onPress, icone = 'plus' }: BotaoFlutuanteProps) {
  return (
    <Pressionavel
      style={estilos.botao}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <Icone nome={icone} tamanho={tamanhos.iconeMaior} cor={cores.tinta} />
      <Texto variante="botao">{rotulo}</Texto>
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: espaco.xl,
    bottom: espaco.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: tamanhos.botao,
    paddingLeft: espaco.md,
    paddingRight: espaco.lg,
    borderRadius: raios.total,
    backgroundColor: cores.lima,
    ...sombras.alta,
  },
});
