import { StyleSheet } from 'react-native';
import { cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { Icone, NomeIcone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

interface ChipProps {
  rotulo: string;
  ativo: boolean;
  onPress: () => void;
  icone?: NomeIcone;
  // Cor do preenchimento quando ativo (ex.: a cor da categoria).
  cor?: string;
}

export function Chip({ rotulo, ativo, onPress, icone, cor = cores.primaria }: ChipProps) {
  return (
    <Pressionavel
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[estilos.chip, ativo && { backgroundColor: cor }]}
    >
      {icone ? (
        <Icone
          nome={icone}
          tamanho={tamanhos.iconeMenor}
          cor={ativo ? cores.sobreEscuro : cor}
        />
      ) : null}
      <Texto variante="detalhe" cor={ativo ? cores.sobreEscuro : cores.tinta}>
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xxs,
    minHeight: tamanhos.chip,
    paddingHorizontal: espaco.md,
    borderRadius: raios.total,
    backgroundColor: cores.superficie,
  },
});
