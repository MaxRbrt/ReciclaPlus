// Faixa horizontal de chips para filtrar por categoria de material.
// "Todos" limpa o filtro; tocar de novo na categoria ativa tambem.

import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { CATEGORIAS } from '@/constantes/categorias';
import { espaco } from '@/constantes/tema';
import { Chip } from './Chip';

interface FiltroCategoriasProps {
  selecionada: number | undefined;
  aoSelecionar: (id: number | undefined) => void;
  style?: StyleProp<ViewStyle>;
}

export function FiltroCategorias({
  selecionada,
  aoSelecionar,
  style,
}: FiltroCategoriasProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[estilos.faixa, style]}
      contentContainerStyle={estilos.conteudo}
    >
      <Chip
        rotulo="Todos"
        ativo={selecionada === undefined}
        onPress={() => aoSelecionar(undefined)}
      />
      {CATEGORIAS.map(categoria => {
        const ativo = selecionada === categoria.id;
        return (
          <Chip
            key={categoria.id}
            rotulo={categoria.nome}
            icone={categoria.icone}
            cor={categoria.cor}
            ativo={ativo}
            onPress={() => aoSelecionar(ativo ? undefined : categoria.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  // Sem isto, uma lista com flex: 1 logo abaixo espreme a faixa.
  faixa: {
    flexGrow: 0,
    flexShrink: 0,
  },
  conteudo: {
    paddingHorizontal: espaco.xl,
    gap: espaco.xs,
    alignItems: 'center',
  },
});
