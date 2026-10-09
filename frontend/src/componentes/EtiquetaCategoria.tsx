import { StyleSheet, View } from 'react-native';
import { CATEGORIAS } from '@/constantes/categorias';
import { comAlfa, cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { Icone } from './Icone';
import { Texto } from './Texto';

interface EtiquetaCategoriaProps {
  id: number;
  nome: string;
  // Grande: com icone, para a tela de detalhe. Padrao: selo pequeno de lista.
  grande?: boolean;
}

// Selo de material. Categoria que o app ainda nao conhece (criada so na
// API) aparece em cor neutra, sem icone.
export function EtiquetaCategoria({ id, nome, grande = false }: EtiquetaCategoriaProps) {
  const local = CATEGORIAS.find(categoria => categoria.id === id);
  const cor = local?.cor ?? cores.tintaSuave;

  return (
    <View
      style={[
        estilos.etiqueta,
        grande && estilos.grande,
        { backgroundColor: comAlfa(cor, 0.12) },
      ]}
    >
      {grande && local ? (
        <Icone nome={local.icone} tamanho={tamanhos.iconeMenor} cor={cor} />
      ) : null}
      <Texto variante={grande ? 'detalhe' : 'rotulo'} cor={cor}>
        {nome}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xxs,
    paddingHorizontal: espaco.xs,
    paddingVertical: espaco.xxs,
    borderRadius: raios.total,
  },
  grande: {
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
  },
});
