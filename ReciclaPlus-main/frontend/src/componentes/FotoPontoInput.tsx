import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Cores, Fontes, Espacamento, Bordas, Sombra } from '@/constantes/tema';

interface FotoPontoInputProps {
  fotoUri: string | null;
  onPress: () => void;
}

export function FotoPontoInput({ fotoUri, onPress }: FotoPontoInputProps) {
  return (
    <TouchableOpacity
      style={estilos.fotoArea}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {fotoUri ? (
        <>
          <Image source={{ uri: fotoUri }} style={estilos.fotoImagem} />
          <View style={estilos.fotoOverlay}>
            <View style={estilos.fotoBadge}>
              <MaterialCommunityIcons
                name="camera-retake"
                size={16}
                color={Cores.branco}
              />
              <Text style={estilos.fotoBadgeTexto}>Trocar foto</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={estilos.fotoPlaceholder}>
          <View style={estilos.fotoIconRow}>
            <MaterialCommunityIcons
              name="camera"
              size={28}
              color={Cores.primaria}
            />
            <Text style={estilos.fotoSeparador}>ou</Text>
            <MaterialCommunityIcons
              name="image-multiple"
              size={28}
              color={Cores.primaria}
            />
          </View>
          <Text style={estilos.fotoTitulo}>Adicionar foto do ponto</Text>
          <Text style={estilos.fotoSub}>
            Toque para tirar uma foto ou escolher da galeria
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  fotoArea: {
    borderRadius: Bordas.raioGrande,
    overflow: 'hidden',
    marginBottom: Espacamento.lg,
    ...Sombra.suave,
  },
  fotoImagem: { width: '100%', height: 200 },
  fotoOverlay: {
    position: 'absolute',
    bottom: Espacamento.sm,
    right: Espacamento.sm,
  },
  fotoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Espacamento.sm,
    paddingVertical: 4,
    borderRadius: Bordas.raioTotal,
  },
  fotoBadgeTexto: {
    color: Cores.branco,
    fontSize: Fontes.pequena,
    fontWeight: Fontes.negrito,
  },
  fotoPlaceholder: {
    height: 180,
    backgroundColor: Cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Cores.cinzaBorda,
    borderStyle: 'dashed',
    borderRadius: Bordas.raioGrande,
    gap: 6,
    padding: Espacamento.md,
  },
  fotoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
  },
  fotoSeparador: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    fontWeight: Fontes.medio_peso,
  },
  fotoTitulo: {
    fontSize: Fontes.normal,
    color: Cores.preto,
    fontWeight: Fontes.muitoNegrito,
    marginTop: 4,
  },
  fotoSub: {
    fontSize: Fontes.pequena,
    color: Cores.cinzaMedio,
    textAlign: 'center',
  },
});
