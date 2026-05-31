import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORIAS } from '@/constantes/categorias';
import { Cores, Fontes, Espacamento, Bordas } from '@/constantes/tema';

interface SelecionadorCategoriasProps {
  selecionadas: number[];
  aoAlternar: (id: number) => void;
}

export function SelecionadorCategorias({
  selecionadas,
  aoAlternar,
}: SelecionadorCategoriasProps) {
  return (
    <View style={estilos.categoriasGrid}>
      {CATEGORIAS.map(cat => {
        const selecionado = selecionadas.includes(cat.id);
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              estilos.catChip,
              selecionado && {
                backgroundColor: cat.cor,
                borderColor: cat.cor,
              },
            ]}
            onPress={() => aoAlternar(cat.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={cat.icone as any}
              size={16}
              color={selecionado ? Cores.branco : cat.cor}
            />
            <Text
              style={[
                estilos.catChipTexto,
                selecionado && { color: Cores.branco },
              ]}
            >
              {cat.nome}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  categoriasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Cores.cinzaBorda,
    borderRadius: Bordas.raioTotal,
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 7,
    backgroundColor: Cores.branco,
  },
  catChipTexto: {
    fontSize: Fontes.pequena,
    fontWeight: Fontes.medio_peso,
    color: Cores.cinzaEscuro,
  },
});
