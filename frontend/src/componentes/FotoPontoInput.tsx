import { Image, StyleSheet, View } from 'react-native';
import { cores, espaco, raios, tamanhos } from '@/constantes/tema';
import { Icone } from './Icone';
import { Pressionavel } from './Pressionavel';
import { Texto } from './Texto';

// Altura da area de foto do formulario.
const ALTURA_FOTO = 200;

interface FotoPontoInputProps {
  fotoUri: string | null;
  onPress: () => void;
}

export function FotoPontoInput({ fotoUri, onPress }: FotoPontoInputProps) {
  return (
    <Pressionavel
      style={estilos.area}
      escala={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={fotoUri ? 'Trocar foto do ponto' : 'Adicionar foto do ponto'}
    >
      {fotoUri ? (
        <>
          <Image source={{ uri: fotoUri }} style={estilos.imagem} />
          <View style={estilos.selo}>
            <Icone
              nome="camera-retake"
              tamanho={tamanhos.iconeMenor}
              cor={cores.sobreEscuro}
            />
            <Texto variante="detalhe" cor={cores.sobreEscuro}>
              Trocar foto
            </Texto>
          </View>
        </>
      ) : (
        <View style={estilos.vazio}>
          <View style={estilos.icones}>
            <Icone nome="camera" tamanho={tamanhos.iconeMaior} cor={cores.primaria} />
            <Texto variante="detalhe" cor={cores.tintaSuave}>
              ou
            </Texto>
            <Icone
              nome="image-multiple"
              tamanho={tamanhos.iconeMaior}
              cor={cores.primaria}
            />
          </View>
          <Texto variante="cartao">Adicionar foto do ponto</Texto>
          <Texto variante="detalhe" cor={cores.tintaSuave} style={estilos.centro}>
            Toque para tirar uma foto ou escolher da galeria
          </Texto>
        </View>
      )}
    </Pressionavel>
  );
}

const estilos = StyleSheet.create({
  area: {
    height: ALTURA_FOTO,
    borderRadius: raios.lg,
    overflow: 'hidden',
    backgroundColor: cores.nevoa,
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  selo: {
    position: 'absolute',
    right: espaco.sm,
    bottom: espaco.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xxs,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.xs,
    borderRadius: raios.total,
    backgroundColor: cores.veu,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xs,
    padding: espaco.md,
    borderRadius: raios.lg,
    borderWidth: tamanhos.borda,
    borderColor: cores.folha,
    borderStyle: 'dashed',
  },
  icones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  centro: {
    textAlign: 'center',
  },
});
