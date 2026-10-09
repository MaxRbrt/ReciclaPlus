import { StyleSheet, View } from 'react-native';
import { CATEGORIAS } from '@/constantes/categorias';
import { espaco } from '@/constantes/tema';
import { Chip } from './Chip';

interface SelecionadorCategoriasProps {
  selecionadas: number[];
  aoAlternar: (id: number) => void;
}

export function SelecionadorCategorias({
  selecionadas,
  aoAlternar,
}: SelecionadorCategoriasProps) {
  return (
    <View style={estilos.grade}>
      {CATEGORIAS.map(categoria => (
        <Chip
          key={categoria.id}
          rotulo={categoria.nome}
          icone={categoria.icone}
          cor={categoria.cor}
          ativo={selecionadas.includes(categoria.id)}
          onPress={() => aoAlternar(categoria.id)}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.xs,
  },
});
