import { StyleSheet, TextInput, View } from 'react-native';
import { cores, espaco, raios, tamanhos, tipografia } from '@/constantes/tema';
import { BotaoIcone } from './BotaoIcone';
import { Icone, NomeIcone } from './Icone';

interface CampoBuscaProps {
  valor: string;
  aoMudar: (texto: string) => void;
  placeholder: string;
  icone?: NomeIcone;
}

export function CampoBusca({
  valor,
  aoMudar,
  placeholder,
  icone = 'magnify',
}: CampoBuscaProps) {
  return (
    <View style={estilos.caixa}>
      <Icone nome={icone} cor={cores.tintaFraca} />
      <TextInput
        style={estilos.entrada}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.tintaFraca}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        returnKeyType="search"
      />
      {valor.length > 0 ? (
        <BotaoIcone
          icone="close-circle"
          rotulo="Limpar busca"
          variante="simples"
          onPress={() => aoMudar('')}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: tamanhos.botao,
    paddingLeft: espaco.md,
    paddingRight: espaco.xxs,
    borderRadius: raios.total,
    backgroundColor: cores.superficie,
  },
  entrada: {
    ...tipografia.corpo,
    flex: 1,
    minHeight: tamanhos.toque,
    paddingRight: espaco.sm,
    color: cores.tinta,
    outlineColor: 'transparent',
  },
});
